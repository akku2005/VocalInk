import React, { useState, useEffect, startTransition } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Check,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const schema = yup
  .object({
    firstName: yup
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .matches(
        /^[a-zA-Z\s]+$/,
        "First name can only contain letters and spaces"
      )
      .required("First name is required"),
    lastName: yup
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .matches(
        /^[a-zA-Z\s]+$/,
        "Last name can only contain letters and spaces"
      )
      .required("Last name is required"),
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      )
      .required("Password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
    role: yup
      .string()
      .oneOf(["reader", "writer", "admin"], "Invalid role selected")
      .default("reader"),
    agreeToTerms: yup
      .boolean()
      .oneOf([true], "You must agree to the terms and conditions"),
  })
  .required();

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [forceRender, setForceRender] = useState(0);
  
  const { register: registerUser, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  // Removed debug console.logs to prevent infinite render loop

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const watchedPassword = watch("password");

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

    return { score, feedback };
  };

    const passwordStrength = watchedPassword ? checkPasswordStrength(watchedPassword) : { score: 0, feedback: [] };

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setInterval(() => {
        setRedirectCountdown((prevCount) => prevCount - 1);
      }, 1000);

      const redirectTimeout = setTimeout(() => {
        navigate('/verify-email', { state: { email: registeredEmail } });
      }, 3000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimeout);
      };
    }
  }, [registrationSuccess, registeredEmail, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      
      if (result && result.success) {
        
        setLoading(false);
        
        // Directly navigate to verify-email page with success message
        navigate('/verify-email', { 
          state: { 
            email: data.email, 
            from: from,
            message: 'Registration successful! Please check your email for verification code.'
          } 
        });
        
        return; // Exit early to avoid the finally block
      } else {
        setFormError("root", { message: result?.error || "An unexpected error occurred." });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Registration failed" });
    }
    
    // Only set loading to false if we didn't have success
    setLoading(false);
  };

  const handleContinueToLogin = () => {
    navigate("/login", { 
      state: { 
        message: "Registration successful! Please check your email for verification." 
      } 
    });
  };

  // Show success screen when registration is successful
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Registration Successful!
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              We've sent a verification code to{" "}
              <span className="font-medium text-text-primary">
                {registeredEmail}
              </span>
            </p>
            <p className="mt-2 text-sm text-primary font-medium">
              Redirecting to verification page in {redirectCountdown} seconds...
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="mx-auto h-8 w-8 text-primary mb-2" />
                  <h3 className="text-lg font-medium text-text-primary">
                    Verify Your Email
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Check your email for a 6-digit verification code and enter it to complete your registration.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => navigate("/verify-email", { 
                      state: { email: registeredEmail, from: from } 
                    })}
                    className="w-full"
                  >
                    Verify Email Now
                  </Button>
                  
                  <Button
                    onClick={handleContinueToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Continue to Login
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-text-secondary">
                    Didn't receive the email?{" "}
                    <button
                      onClick={() => navigate("/verify-email", { 
                        state: { email: registeredEmail, resend: true } 
                      })}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Resend verification code
                    </button>
                  </p>
                </div>
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
          <h2 className="text-3xl font-bold text-text-primary">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Join VocalInk and start your journey
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-text-primary"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      className="pl-10"
                      {...register("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-error">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-text-primary"
                  >
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      className="pl-10"
                      {...register("lastName")}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-error">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

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
                  htmlFor="role"
                  className="text-sm font-medium text-text-primary"
                >
                  Account Type
                </label>
                <select
                  id="role"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  {...register("role")}
                >
                  <option value="reader">Reader</option>
                  <option value="writer">Writer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-error">
                    {errors.role.message}
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
                    placeholder="Create a strong password"
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
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
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

              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    {...register("agreeToTerms")}
                  />
                  <span className="text-sm text-text-secondary">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-sm text-error">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{" "}
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

export default Register;