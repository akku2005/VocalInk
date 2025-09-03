import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Lock, Shield, Check, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const resetPasswordSchema = yup
  .object({
    token: yup
      .string()
      .required("Reset token is required"),
    code: yup
      .string()
      .length(6, "Verification code must be 6 digits")
      .matches(/^\d+$/, "Verification code must contain only numbers")
      .required("Verification code is required"),
    newPassword: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      )
      .required("New password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword"), null], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  
  const { resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL params or location state
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const { token: tokenFromState } = location.state || {};
  const token = tokenFromUrl || tokenFromState;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
    },
  });

  const watchedPassword = watch("newPassword");

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One special character (@$!%*?&)");
    }

    setPasswordStrength({ score, feedback });
  };

  // Update password strength when password changes
  useEffect(() => {
    if (watchedPassword) {
      checkPasswordStrength(watchedPassword);
    }
  }, [watchedPassword]);

  const onSubmit = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await resetPassword(data.token, data.code, data.newPassword);
      
      if (result.success) {
        setResetSuccess(true);
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Password reset successful! Please sign in with your new password." }
          });
        }, 3000);
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Password reset failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Password Reset Successful!
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Your password has been successfully reset. You'll be redirected to the login page shortly.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-text-secondary">
                  Redirecting to login in 3 seconds...
                </p>
                <Button
                  onClick={() => navigate("/login", { 
                    state: { message: "Password reset successful! Please sign in with your new password." }
                  })}
                  className="w-full"
                >
                  Go to Login Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
                
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter the verification code from your email and create a new password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <button
                onClick={handleBackToLogin}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ←
              </button>
              Create New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root && (
                <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                  {errors.root.message}
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-text-primary"
                >
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-sm text-error">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-text-primary"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password"
                    className="pl-10 pr-10"
                    {...register("newPassword")}
                    onChange={(e) => {
                      register("newPassword").onChange(e);
                      checkPasswordStrength(e.target.value);
                    }}
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
                {errors.newPassword && (
                  <p className="text-sm text-error">
                    {errors.newPassword.message}
                  </p>
                )}

                {/* Password strength indicator */}
                {watchedPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-text-secondary">
                        Password strength:
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-2 w-8 rounded-full ${
                              level <= passwordStrength.score
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-text-secondary">
                        <p className="mb-1">Requirements:</p>
                        <ul className="space-y-1">
                          {passwordStrength.feedback.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-text-primary"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="pl-10 pr-10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-error">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 