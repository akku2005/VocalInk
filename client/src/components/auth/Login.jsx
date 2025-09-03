import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, AlertTriangle, Clock } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const loginSchema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    password: yup
      .string()
      .required("Password is required"),
  })
  .required();

const twoFactorSchema = yup
  .object({
    twoFactorToken: yup
      .string()
      .length(6, "2FA code must be 6 digits")
      .matches(/^\d+$/, "2FA code must contain only numbers")
      .required("2FA code is required"),
  })
  .required();

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const { login, error, clearError, accountLocked, lockoutUntil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    setValue,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
    setError: setFormError2FA,
  } = useForm({
    resolver: yupResolver(twoFactorSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        if (result.twoFactorRequired) {
          // 2FA required - store credentials for 2FA submission
          setLoginEmail(data.email);
          setLoginPassword(data.password);
          setTwoFactorRequired(true);
        } else {
          // Login successful, redirect
          navigate(from, { replace: true });
        }
      } else {
        if (result.accountLocked) {
          // Account is locked - error is already set in context
          setLoading(false);
          return;
        }
        if (result.requiresVerification) {
          // Email verification required - redirect to verification page
          navigate("/verify-email", { 
            state: { 
              email: data.email, 
              from: from,
              message: result.error 
            } 
          });
          return;
        }
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit2FA = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      // Since the backend expects 2FA token during login, we need to call login again
      // with the 2FA token along with the stored credentials
      const result = await login(loginEmail, loginPassword, data.twoFactorToken);
      
      if (result.success) {
        // 2FA successful, redirect
        navigate(from, { replace: true });
      } else {
        setFormError2FA("root", { message: result.error });
      }
    } catch (error) {
      setFormError2FA("root", { message: error.message || "2FA verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setTwoFactorRequired(false);
    clearError();
  };

  // Format lockout time
  const formatLockoutTime = (lockoutUntil) => {
    if (!lockoutUntil) return "";
    const lockoutDate = new Date(lockoutUntil);
    const now = new Date();
    const diffMs = lockoutDate - now;
    const diffMins = Math.ceil(diffMs / 60000);
    
    if (diffMins <= 0) return "Account is now unlocked";
    if (diffMins < 60) return `${diffMins} minute(s)`;
    const diffHours = Math.ceil(diffMins / 60);
    return `${diffHours} hour(s)`;
  };

  // Show account lockout message
  if (accountLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Account Temporarily Locked
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {error}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Clock className="mx-auto h-8 w-8 text-red-500 mb-2" />
                  <h3 className="text-lg font-medium text-text-primary">
                    Lockout Duration
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Time remaining: <span className="font-medium text-red-600">
                      {formatLockoutTime(lockoutUntil)}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      clearError();
                      setValue("email", "");
                      setValue("password", "");
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Try Again Later
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-text-secondary">
                      Forgot your password?{" "}
                      <Link
                        to="/forgot-password"
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        Reset it here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (twoFactorRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button
                  onClick={handleBackToLogin}
                  className="p-1 hover:bg-secondary-btn-hover rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--secondary-btn)' }}
                >
                  <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-color)' }} />
                </button>
                Verify 2FA Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit2FA(onSubmit2FA)} className="space-y-6">
                {errors2FA.root && (
                  <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                    {errors2FA.root.message}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="twoFactorToken"
                    className="text-sm font-medium text-text-primary"
                  >
                    2FA Code
                  </label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    {...register2FA("twoFactorToken")}
                  />
                  {errors2FA.twoFactorToken && (
                    <p className="text-sm text-error">
                      {errors2FA.twoFactorToken.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don't have access to your 2FA device?{" "}
              <Link
                to="/contact-support"
                className="font-medium text-primary hover:text-primary/80"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary">Welcome back</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to your VocalInk account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Show auth context error (from backend) or form validation error */}
              {(error || errors.root) && (
                <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                  {error || errors.root?.message}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-text-primary"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-text-primary"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
