import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Mail, Shield, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { request2FARecovery, verify2FARecovery } from "../../services/settingsService";

const emailSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
}).required();

const recoveryCodeSchema = yup.object({
  recoveryCode: yup
    .string()
    .length(6, "Recovery code must be 6 digits")
    .matches(/^\d+$/, "Recovery code must contain only numbers")
    .required("Recovery code is required"),
}).required();

const TwoFactorRecoveryPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "verify" | "success"
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: yupResolver(emailSchema),
  });

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
    setError: setCodeError,
  } = useForm({
    resolver: yupResolver(recoveryCodeSchema),
  });

  const onSubmitEmail = async (data) => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      await request2FARecovery(data.email);
      setEmail(data.email);
      setStep("verify");
      setMessage("If an account exists with 2FA enabled, a recovery code has been sent.");
    } catch {
      // We still show success message to prevent email enumeration
      setEmail(data.email);
      setStep("verify");
      setMessage("If an account exists with 2FA enabled, a recovery code has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (data) => {
    setLoading(true);
    setError("");
    
    try {
      await verify2FARecovery(email, data.recoveryCode);
      setStep("success");
    } catch (err) {
      setCodeError("root", {
        message: err.response?.data?.message || "Invalid or expired recovery code",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              2FA Disabled Successfully
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Two-factor authentication has been removed from your account.
              You can now log in with just your email and password.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Security Recommendation
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        We strongly recommend re-enabling two-factor authentication
                        after logging in to keep your account secure.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Enter the 6-digit recovery code sent to your email
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setMessage("");
                  }}
                  className="p-1 hover:bg-secondary-btn-hover rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--secondary-btn)' }}
                >
                  <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-color)' }} />
                </button>
                Enter Recovery Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <div className="mb-4 p-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-6">
                {codeErrors.root && (
                  <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                    {codeErrors.root.message}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="recoveryCode"
                    className="text-sm font-medium text-text-primary"
                  >
                    Recovery Code
                  </label>
                  <Input
                    id="recoveryCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    {...registerCode("recoveryCode")}
                  />
                  {codeErrors.recoveryCode && (
                    <p className="text-sm text-error">
                      {codeErrors.recoveryCode.message}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary">
                    The code expires in 15 minutes
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? "Verifying..." : "Disable 2FA"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={() => onSubmitEmail({ email })}
                className="font-medium text-primary hover:text-primary/80"
                disabled={loading}
              >
                Resend Code
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email step (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            Recover Your Account
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Lost access to your authenticator app and backup codes?
            We'll help you regain access to your account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link
                to="/login"
                className="p-1 hover:bg-secondary-btn-hover rounded-full transition-colors"
                style={{ backgroundColor: 'var(--secondary-btn)' }}
              >
                <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-color)' }} />
              </Link>
              Account Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">How it works:</strong> We'll send
                  a one-time recovery code to your email address. Use this code to
                  temporarily disable 2FA on your account.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-text-primary"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-secondary" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...registerEmail("email")}
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-error">{emailErrors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? "Sending..." : "Send Recovery Code"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Remember your backup codes?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorRecoveryPage;
