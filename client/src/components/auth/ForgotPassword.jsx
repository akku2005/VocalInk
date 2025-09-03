import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Mail, Shield, Check, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const forgotPasswordSchema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
  })
  .required();

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailExists, setEmailExists] = useState(false);
  
  const { forgotPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    if (loading) return; // Prevent duplicate submissions
    
    setLoading(true);
    clearError();
    
    try {
      const result = await forgotPassword(data.email);
      
      if (result.success) {
        setEmail(data.email);
        setEmailSent(true);
        setResendCooldown(60); // Start cooldown immediately
        
        // Show appropriate message based on server response
        if (result.message.includes('if an account exists')) {
          // Non-existent email case
          setEmailExists(false);
          setFormError("root", { 
            message: "If an account with this email exists, you will receive password reset instructions. Please check your email and spam folder.",
            type: "info"
          });
        } else {
          // Existing email case
          setEmailExists(true);
          setFormError("root", { 
            message: "Password reset instructions have been sent to your email. Please check your inbox and spam folder.",
            type: "success"
          });
        }
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Failed to send password reset email" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = async () => {
    if (!email || loading || resendCooldown > 0) return;
    
    setLoading(true);
    clearError();
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setResendCooldown(60); // 60 second cooldown
        
        // Show appropriate message based on server response
        if (result.message.includes('if an account exists')) {
          // Non-existent email case
          setFormError("root", { 
            message: "If an account with this email exists, you will receive password reset instructions. Please check your email and spam folder.",
            type: "info"
          });
        } else {
          // Existing email case
          setFormError("root", { 
            message: "Password reset instructions have been sent to your email. Please check your inbox and spam folder.",
            type: "success"
          });
        }
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Failed to resend password reset email" });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full ${
              emailExists ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              {emailExists ? (
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              {emailExists ? 'Check Your Email' : 'Request Submitted'}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {emailExists ? (
                <>
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-text-primary">
                    {email}
                  </span>
                  <br />
                  <span className="text-xs text-text-secondary mt-1">
                    If you don't see it, check your spam folder
                  </span>
                </>
              ) : (
                <>
                  If an account with <span className="font-medium text-text-primary">{email}</span> exists, 
                  you will receive password reset instructions.
                  <br />
                  <span className="text-xs text-text-secondary mt-1">
                    Please check your email and spam folder
                  </span>
                </>
              )}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="mx-auto h-8 w-8 text-primary mb-2" />
                  <h3 className="text-lg font-medium text-text-primary">
                    {emailExists ? 'Reset Your Password' : 'Account Security'}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {emailExists ? (
                      'Click the link in your email to reset your password. The link will expire in 1 hour.'
                    ) : (
                      'For security reasons, we cannot confirm whether an account exists with this email address.'
                    )}
                  </p>
                </div>

                {emailExists && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/reset-password", { 
                        state: { email: email } 
                      })}
                      className="w-full"
                    >
                      Reset Password Now
                    </Button>
                  </div>
                )}
                
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>

              <div className="text-center mt-6">
                <p className="text-xs text-text-secondary">
                  Didn't receive the email?{" "}
                  <button
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-medium transition-colors ${
                      resendCooldown > 0 || loading
                        ? 'text-text-secondary cursor-not-allowed'
                        : 'text-primary hover:text-primary/80'
                    }`}
                  >
                    {loading ? 'Sending...' : 
                     resendCooldown > 0 ? 
                     `Resend in ${resendCooldown}s` : 
                     'Resend password reset email'}
                  </button>
                </p>
              </div>
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email address and we'll send you a link to reset your password.
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
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root && (
                <div className={`p-3 text-sm rounded-md ${
                  errors.root.type === "success" 
                    ? "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20" 
                    : errors.root.type === "info"
                    ? "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20"
                    : "text-error bg-error/10"
                }`}>
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
                  htmlFor="email"
                  className="text-sm font-medium text-text-primary"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;