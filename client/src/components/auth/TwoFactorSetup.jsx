import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Shield, Check, ArrowLeft, Smartphone, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

const twoFactorSchema = yup
  .object({
    token: yup
      .string()
      .length(6, "2FA code must be 6 digits")
      .matches(/^\d+$/, "2FA code must contain only numbers")
      .required("2FA code is required"),
  })
  .required();

const TwoFactorSetup = () => {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [step, setStep] = useState("setup"); // "setup" or "verify"
  
  const { setup2FA, verify2FASetup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm({
    resolver: yupResolver(twoFactorSchema),
  });

  const handleSetup2FA = async () => {
    setLoading(true);
    clearError();
    
    try {
      const result = await setup2FA();
      
      if (result.success) {
        setSetupData(result.data);
        setStep("verify");
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "Failed to setup 2FA" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await verify2FASetup(data.token);
      
      if (result.success) {
        setSetupSuccess(true);
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate("/settings", { 
            state: { message: "Two-factor authentication enabled successfully!" }
          });
        }, 3000);
      } else {
        setFormError("root", { message: result.error });
      }
    } catch (error) {
      setFormError("root", { message: error.message || "2FA verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSettings = () => {
    navigate("/settings");
  };

  const handleBackToSetup = () => {
    setStep("setup");
    setSetupData(null);
    clearError();
  };

  if (setupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              2FA Setup Complete!
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Two-factor authentication has been enabled for your account. You'll be redirected to settings shortly.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-text-secondary">
                  Redirecting to settings in 3 seconds...
                </p>
                <Button
                  onClick={() => navigate("/settings", { 
                    state: { message: "Two-factor authentication enabled successfully!" }
                  })}
                  className="w-full"
                >
                  Go to Settings Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "verify" && setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-text-primary">
              Verify 2FA Setup
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Scan the QR code with your authenticator app and enter the 6-digit code
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button
                  onClick={handleBackToSetup}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                 2FA Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img
                        src={setupData.qrCode}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>

                  {/* Manual Entry */}
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      Or manually enter this code:
                    </p>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <code className="text-sm font-mono text-text-primary">
                        {setupData.secret}
                      </code>
                    </div>
                  </div>

                  {/* Verification Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {errors.root && (
                      <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                        {errors.root.message}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label
                        htmlFor="token"
                        className="text-sm font-medium text-text-primary"
                      >
                        2FA Code
                      </label>
                      <Input
                        id="token"
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        {...register("token")}
                      />
                      {errors.token && (
                        <p className="text-sm text-error">
                          {errors.token.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify & Enable 2FA"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Need help setting up 2FA?{" "}
              <a
                href="https://support.google.com/accounts/answer/185833?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80"
              >
                View setup guide
              </a>
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
            Enable Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Add an extra layer of security to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <button
                onClick={handleBackToSettings}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ←
              </button>
              2FA Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-text-primary">Download an Authenticator App</h3>
                    <p className="text-sm text-text-secondary">
                      We recommend Google Authenticator, Authy, or Microsoft Authenticator
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-text-primary">Scan QR Code</h3>
                    <p className="text-sm text-text-secondary">
                      Use your app to scan the QR code that will appear in the next step
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-text-primary">Verify Setup</h3>
                    <p className="text-sm text-text-secondary">
                      Enter the 6-digit code from your app to complete the setup
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSetup2FA}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Setting up..." : "Start 2FA Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            <Button
              onClick={handleBackToSettings}
              variant="outline"
              className="w-full"
            >
              Back to Settings
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup; 