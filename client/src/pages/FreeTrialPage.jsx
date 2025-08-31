import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  Clock,
  Gift,
  Star,
  ArrowRight,
  X,
  Brain,
  Mic,
  Target,
  Users,
  BarChart3,
  Shield,
  Globe,
  Palette,
  Award,
  TrendingUp,
  Lock,
  Unlock,
  Rocket,
  Heart,
} from "lucide-react";

const FreeTrialPage = () => {
  const { isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
    useCase: "",
  });

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const plans = {
    pro: {
      name: "Pro",
      price: 19,
      originalPrice: 29,
      description: "Perfect for serious content creators",
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      features: [
        "Unlimited blog posts",
        "Premium TTS (2 hours/day)",
        "Advanced AI writing assistant",
        "Enhanced analytics & insights",
        "Priority support",
        "Custom badges & rewards",
        "Early access to features",
        "Ad-free experience",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: 99,
      description: "For teams and businesses",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      features: [
        "Everything in Pro",
        "Unlimited TTS usage",
        "Advanced AI models",
        "Team collaboration",
        "White-label solutions",
        "Custom integrations",
        "Dedicated support",
        "Advanced security",
      ],
    },
  };

  const trialBenefits = [
    {
      icon: Clock,
      title: "14 Days Free",
      description: "Full access to all Pro features for 14 days, no credit card required.",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: Gift,
      title: "No Commitment",
      description: "Cancel anytime during your trial. No hidden fees or automatic charges.",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: Star,
      title: "Premium Support",
      description: "Get priority support during your trial to help you get the most out of VocalInk.",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: Rocket,
      title: "Instant Access",
      description: "Start creating immediately after signup. No waiting or approval process.",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const proFeatures = [
    {
      icon: Brain,
      title: "Advanced AI Writing Assistant",
      description: "Get intelligent suggestions, content optimization, and creative ideas powered by cutting-edge AI models.",
      available: true,
    },
    {
      icon: Mic,
      title: "Premium Text-to-Speech",
      description: "Convert your content to natural-sounding audio with 100+ premium voices and advanced controls.",
      available: true,
    },
    {
      icon: Target,
      title: "Smart Content Optimization",
      description: "AI-powered SEO suggestions, readability analysis, and engagement optimization.",
      available: true,
    },
    {
      icon: Users,
      title: "Advanced Collaboration",
      description: "Real-time collaboration tools, team management, and workflow optimization.",
      available: false,
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Advanced insights with AI-powered predictions for content performance and audience behavior.",
      available: false,
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Advanced security features, SSO integration, and compliance certifications.",
      available: false,
    },
  ];

  const useCases = [
    "Personal Blogging",
    "Business Content Marketing",
    "Educational Content",
    "News & Journalism",
    "Creative Writing",
    "Technical Documentation",
    "Social Media Content",
    "Email Marketing",
    "E-book Creation",
    "Podcast Scripts",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      console.log("Free Trial Form Submitted:", formData);
      // TODO: Implement trial signup logic
    }
  };

  const nextStep = () => {
    if (formData.firstName && formData.lastName && formData.email) {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Start Your Free Trial
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-[var(--text-color)] mb-6 leading-tight">
            Experience{" "}
            <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
              VocalInk Pro
            </span>{" "}
            Free for 14 Days
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[var(--light-text-color)] max-w-3xl mx-auto leading-relaxed px-4">
            No credit card required • Full access to all Pro features • Cancel anytime • 
            Join thousands of creators who've transformed their content creation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Trial Form */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[var(--text-color)] mb-2">
                  Start Your Free Trial
                </CardTitle>
                <p className="text-[var(--light-text-color)]">
                  {step === 1 
                    ? "Step 1: Basic Information" 
                    : "Step 2: Choose Your Plan"
                  }
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            First Name *
                          </label>
                          <Input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            placeholder="John"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            Last Name *
                          </label>
                          <Input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            placeholder="Doe"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="john@example.com"
                          className="w-full"
                        />
                      </div>

                      {!isAuthenticated && (
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            Password *
                          </label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              placeholder="Create a password"
                              className="w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--light-text-color)] hover:text-[var(--text-color)]"
                            >
                              {showPassword ? <X className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                          Company (Optional)
                        </label>
                        <Input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Your Company"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                          Primary Use Case
                        </label>
                        <select
                          name="useCase"
                          value={formData.useCase}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select your primary use case</option>
                          {useCases.map((useCase) => (
                            <option key={useCase} value={useCase}>
                              {useCase}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                        onClick={nextStep}
                      >
                        Continue to Plan Selection
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Plan Selection */}
                      <div className="space-y-4">
                        {Object.entries(plans).map(([key, plan]) => (
                          <div
                            key={key}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedPlan === key
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                : "border-[var(--border-color)] hover:border-indigo-300"
                            }`}
                            onClick={() => handlePlanSelect(key)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                                  <plan.icon className={`w-5 h-5 ${plan.color}`} />
                                </div>
                                <div>
                                  <div className="font-semibold text-[var(--text-color)]">
                                    {plan.name} Plan
                                  </div>
                                  <div className="text-sm text-[var(--light-text-color)]">
                                    {plan.description}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-[var(--text-color)]">
                                  ${plan.price}/month
                                </div>
                                {plan.originalPrice && (
                                  <div className="text-sm text-[var(--light-text-color)] line-through">
                                    ${plan.originalPrice}/month
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                        >
                          Start Free Trial
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-sm text-[var(--light-text-color)] hover:text-[var(--text-color)]"
                        >
                          ← Back to previous step
                        </button>
                      </div>
                    </>
                  )}
                </form>

                {/* Trust Indicators */}
                <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--light-text-color)]">
                      <Check className="w-4 h-4 text-green-500" />
                      No credit card required
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--light-text-color)]">
                      <Check className="w-4 h-4 text-green-500" />
                      Cancel anytime
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--light-text-color)]">
                      <Check className="w-4 h-4 text-green-500" />
                      Full access to Pro features
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trial Benefits & Features */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Trial Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                Why Start a Free Trial?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trialBenefits.map((benefit, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${benefit.bgColor} flex-shrink-0`}>
                          <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--text-color)] text-sm mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-[var(--light-text-color)] text-xs leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Pro Features */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                What You'll Get Access To
              </h2>
              <div className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          feature.available 
                            ? "bg-green-100 dark:bg-green-900/20" 
                            : "bg-gray-100 dark:bg-gray-800"
                        } flex-shrink-0`}>
                          <feature.icon className={`w-5 h-5 ${
                            feature.available 
                              ? "text-green-600" 
                              : "text-gray-400"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[var(--text-color)] text-sm mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-[var(--light-text-color)] text-xs leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {feature.available ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">
                    Ready to Transform Your Content?
                  </h3>
                  <p className="text-green-100 mb-4">
                    Join thousands of creators who've already upgraded their VocalInk experience. 
                    Start your free trial today!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      size="md"
                      className="bg-white text-green-600 hover:bg-gray-100"
                      onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Link to="/upgrade">
                      <Button
                        variant="outline"
                        size="md"
                        className="border-white text-white hover:bg-white hover:text-green-600"
                      >
                        View All Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeTrialPage; 