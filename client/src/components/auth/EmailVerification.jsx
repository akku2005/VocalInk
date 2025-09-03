import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Mail, Check, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const verificationSchema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    code: yup
      .string()
      .length(6, "Verification code must be 6 digits")
      .matches(/^\d+$/, "Verification code must contain only numbers")
      .required("Verification code is required"),
  })
  .required();

const EmailVerification = () => {
  const [loading, setLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const { verifyEmail, resendVerification, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and destination from location state
  const { email: initialEmail, from, message } = location.state || {};
  const destination = from || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(verificationSchema),
    defaultValues: {
      email: initialEmail || "",
    },
  });

  const watchedEmail = watch("email");

  const onSubmit = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await verifyEmail(data.email, data.code);
      
      if (result.success) {
        setVerificationSuccess(true);
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 2000);
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Email verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!watchedEmail) {
      setFormError("email", { message: "Please enter your email address first" });
      return;
    }

    setResendLoading(true);
    clearError();
    
    try {
      const result = await resendVerification(watchedEmail);
      
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Failed to resend verification" });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login", { 
      state: { 
        message: "Please verify your email before logging in." 
      } 
    });
  };

  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Email Verified Successfully!
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Your email has been verified. Redirecting you to your dashboard...
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-text-secondary">
                  You can now log in to your account and access all features.
                </p>
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
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {message || "Enter the 6-digit verification code sent to your email"}
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
              Email Verification
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

              {resendSuccess && (
                <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md">
                  Verification code sent successfully! Check your email.
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-3">
                  Didn't receive the verification code?
                </p>
                <Button
                  onClick={handleResendVerification}
                  disabled={resendLoading || !watchedEmail}
                  loading={resendLoading}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Code"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Need help?{" "}
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
};

export default EmailVerification; 