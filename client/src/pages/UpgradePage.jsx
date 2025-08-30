import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  Check,
  Crown,
  Zap,
  Star,
  Sparkles,
  Mic,
  Brain,
  Users,
  BarChart3,
  Shield,
  Gift,
  Clock,
  Target,
  Award,
  TrendingUp,
  Palette,
  Globe,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const UpgradePage = () => {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const plans = {
    free: {
      name: "Free",
      price: 0,
      description: "Perfect for getting started",
      icon: Star,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      features: [
        "Up to 5 blog posts per month",
        "Basic TTS (5 minutes/day)",
        "Standard analytics",
        "Community badges",
        "Basic AI recommendations",
        "Mobile app access",
      ],
      limitations: [
        "Limited AI features",
        "Basic support",
        "Standard content",
        "No priority features",
      ],
    },
    pro: {
      name: "Pro",
      price: billingCycle === "monthly" ? 19 : 190,
      originalPrice: billingCycle === "monthly" ? 29 : 290,
      description: "For serious content creators",
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      popular: true,
      features: [
        "Unlimited blog posts",
        "Premium TTS (2 hours/day)",
        "Advanced AI writing assistant",
        "Enhanced analytics & insights",
        "Priority support",
        "Custom badges & rewards",
        "Early access to features",
        "Ad-free experience",
        "Advanced collaboration tools",
        "Series monetization",
      ],
      limitations: [
        "No enterprise features",
        "Limited API access",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: billingCycle === "monthly" ? 99 : 990,
      description: "For teams and businesses",
      icon: Crown,
      color: "text-purple-600 dark:text-purple-400",
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
        "Analytics dashboard",
        "API access",
        "Custom branding",
        "Priority feature requests",
      ],
      limitations: [
        "Contact sales for custom pricing",
        "Annual billing recommended",
      ],
    },
  };

  const aiFeatures = [
    {
      icon: Brain,
      title: "Advanced AI Writing Assistant",
      description: "Get intelligent suggestions, content optimization, and creative ideas powered by cutting-edge AI models.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Mic,
      title: "Premium Text-to-Speech",
      description: "Convert your content to natural-sounding audio with 100+ premium voices and advanced controls.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Sparkles,
      title: "AI Content Generation",
      description: "Generate blog outlines, summaries, and even complete articles with AI assistance.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Target,
      title: "Smart Content Optimization",
      description: "AI-powered SEO suggestions, readability analysis, and engagement optimization.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Users,
      title: "Collaborative AI Features",
      description: "Real-time collaboration with AI-powered suggestions and team workflow optimization.",
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Advanced insights with AI-powered predictions for content performance and audience behavior.",
      free: false,
      pro: false,
      enterprise: true,
    },
  ];

  const gamificationFeatures = [
    {
      icon: Award,
      title: "Custom Badges & Rewards",
      description: "Create and customize badges, set custom XP rules, and design unique reward systems.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: TrendingUp,
      title: "Advanced Leaderboards",
      description: "Custom leaderboards, team competitions, and detailed progress tracking.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Gift,
      title: "Exclusive Rewards",
      description: "Access to premium rewards, early badge releases, and special achievement unlocks.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Clock,
      title: "Time-based Challenges",
      description: "Seasonal events, time-limited achievements, and dynamic reward systems.",
      free: false,
      pro: true,
      enterprise: true,
    },
  ];

  const monetizationFeatures = [
    {
      icon: Shield,
      title: "Content Monetization",
      description: "Set premium content, subscription tiers, and monetize your expertise.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Globe,
      title: "Multi-platform Publishing",
      description: "Publish to multiple platforms, cross-platform analytics, and unified content management.",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Remove VocalInk branding, add your logo, and create branded experiences.",
      free: false,
      pro: false,
      enterprise: true,
    },
  ];

  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial for all Pro plans. No credit card required to start your trial."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "You can upgrade your plan at any time. Downgrades take effect at the next billing cycle."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund."
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-[var(--text-color)] mb-6 leading-tight">
            Unlock Your{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Full Potential
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[var(--light-text-color)] max-w-3xl mx-auto leading-relaxed px-4">
            Transform your content creation with advanced AI tools, premium features, and exclusive benefits. 
            Join thousands of creators who've already upgraded their VocalInk experience.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8 lg:mb-18">
          <div className="glassmorphism-card p-1 shadow-lg">
            <div className="flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base ${
                  billingCycle === "monthly"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-[var(--light-text-color)] hover:text-[var(--text-color)]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base ${
                  billingCycle === "annual"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-[var(--light-text-color)] hover:text-[var(--text-color)]"
                }`}
              >
                <span className="hidden sm:inline">Annual</span>
                <span className="sm:hidden">Year</span>
                <span className="ml-1 sm:ml-2 text-xs bg-green-100 text-green-700 px-1 sm:px-2 py-1 rounded-full">
                  Save 35%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20">
          {Object.entries(plans).map(([key, plan]) => (
            <Card
              key={key}
              className={`relative transition-all duration-300 hover:scale-105 cursor-pointer ${
                plan.popular
                  ? "ring-2 ring-indigo-500 shadow-2xl scale-105 lg:scale-110"
                  : "hover:shadow-xl"
              } ${selectedPlan === key ? "ring-2 ring-indigo-500" : ""}`}
              onClick={() => setSelectedPlan(key)}
            >
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4 sm:pb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full ${plan.bgColor} mb-4`}>
                  <plan.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${plan.color}`} />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <p className="text-[var(--light-text-color)] text-sm sm:text-base">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-2xl sm:text-4xl font-bold text-[var(--text-color)]">
                    ${plan.price}
                  </span>
                  <span className="text-[var(--light-text-color)] text-sm sm:text-base">
                    {billingCycle === "monthly" ? "/month" : "/year"}
                  </span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-sm sm:text-lg text-[var(--light-text-color)] line-through">
                      ${plan.originalPrice}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-[var(--text-color)]">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <div className="space-y-2 sm:space-y-3">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-[var(--light-text-color)]">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 sm:pt-6">
                  {key === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Link to="/free-trial">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                      >
                        <span className="hidden sm:inline">Upgrade Now</span>
                        <span className="sm:hidden">Upgrade</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="space-y-12 lg:space-y-16">
          {/* AI Features */}
          <section>
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-color)] mb-4">
                AI-Powered Features
              </h2>
              <p className="text-base sm:text-lg text-[var(--light-text-color)] max-w-2xl mx-auto leading-relaxed px-4">
                Leverage cutting-edge artificial intelligence to create, optimize, and distribute your content like never before.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {aiFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-[var(--text-color)] text-sm sm:text-base">{feature.title}</h3>
                    </div>
                    <p className="text-[var(--light-text-color)] text-xs sm:text-sm mb-4 leading-relaxed">{feature.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                      <span className="text-[var(--light-text-color)]">Available in:</span>
                      <div className="flex gap-1 flex-wrap">
                        {["free", "pro", "enterprise"].map((plan) => (
                          <span
                            key={plan}
                            className={`px-2 py-1 rounded text-xs ${
                              feature[plan]
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-[var(--secondary-btn)] text-[var(--light-text-color)]"
                            }`}
                          >
                            {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Enterprise"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Gamification Features */}
          <section>
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-color)] mb-4">
                Enhanced Gamification
              </h2>
              <p className="text-base sm:text-lg text-[var(--light-text-color)] max-w-2xl mx-auto leading-relaxed px-4">
                Take your engagement to the next level with advanced gamification features and custom reward systems.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {gamificationFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-[var(--text-color)] text-sm sm:text-base">{feature.title}</h3>
                    </div>
                    <p className="text-[var(--light-text-color)] text-xs sm:text-sm mb-4 leading-relaxed">{feature.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                      <span className="text-[var(--light-text-color)]">Available in:</span>
                      <div className="flex gap-1 flex-wrap">
                        {["free", "pro", "enterprise"].map((plan) => (
                          <span
                            key={plan}
                            className={`px-2 py-1 rounded text-xs ${
                              feature[plan]
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-[var(--secondary-btn)] text-[var(--light-text-color)]"
                            }`}
                          >
                            {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Enterprise"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Monetization Features */}
          <section>
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-color)] mb-4">
                Monetization & Business
              </h2>
              <p className="text-base sm:text-lg text-[var(--light-text-color)] max-w-2xl mx-auto leading-relaxed px-4">
                Turn your content into a sustainable business with advanced monetization tools and business features.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {monetizationFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-[var(--text-color)] text-sm sm:text-base">{feature.title}</h3>
                    </div>
                    <p className="text-[var(--light-text-color)] text-xs sm:text-sm mb-4 leading-relaxed">{feature.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                      <span className="text-[var(--light-text-color)]">Available in:</span>
                      <div className="flex gap-1 flex-wrap">
                        {["free", "pro", "enterprise"].map((plan) => (
                          <span
                            key={plan}
                            className={`px-2 py-1 rounded text-xs ${
                              feature[plan]
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-[var(--secondary-btn)] text-[var(--light-text-color)]"
                            }`}
                          >
                            {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Enterprise"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 lg:py-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Content?
              </h2>
              <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed px-4">
                Join thousands of creators who've already upgraded their VocalInk experience. 
                Start your journey today and unlock unlimited possibilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
                <Link to="/free-trial">
                  <Button
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-gray-100 shadow-lg hover:shadow-xl flex-1 sm:flex-initial"
                  >
                    <span className="hidden sm:inline">Start Free Trial</span>
                    <span className="sm:hidden">Free Trial</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact-sales">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-indigo-600 flex-1 sm:flex-initial"
                  >
                    <span className="hidden sm:inline">Contact Sales</span>
                    <span className="sm:hidden">Contact</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-color)] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-[var(--light-text-color)] px-4">
              Everything you need to know about upgrading to VocalInk Pro
            </p>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-[var(--secondary-btn-hover)] transition-colors duration-200"
                  >
                    <h3 className="font-semibold text-[var(--text-color)] text-sm sm:text-base pr-4">
                      {faq.question}
                    </h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-[var(--light-text-color)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--light-text-color)] flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <p className="text-[var(--light-text-color)] text-sm sm:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 lg:mt-20">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-color)] mb-4">
              Trusted by Content Creators Worldwide
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 text-center">
            <div className="glassmorphism-card p-4 sm:p-6 shadow-md">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">50K+</div>
              <div className="text-xs sm:text-sm text-[var(--light-text-color)]">Active Users</div>
            </div>
            <div className="glassmorphism-card p-4 sm:p-6 shadow-md">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-xs sm:text-sm text-[var(--light-text-color)]">Posts Created</div>
            </div>
            <div className="glassmorphism-card p-4 sm:p-6 shadow-md">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-xs sm:text-sm text-[var(--light-text-color)]">Uptime</div>
            </div>
            <div className="glassmorphism-card p-4 sm:p-6 shadow-md">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">4.9★</div>
              <div className="text-xs sm:text-sm text-[var(--light-text-color)]">User Rating</div>
            </div>
          </div>
        </div>

        {/* Mobile-First Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 glassmorphism-card border-t border-[var(--border-color)] p-4 shadow-lg sm:hidden z-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-color)]">
                {plans[selectedPlan].name} Plan
              </div>
              <div className="text-xs text-[var(--light-text-color)]">
                ${plans[selectedPlan].price}/{billingCycle === "monthly" ? "mo" : "yr"}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <Link to="/free-trial" className="flex items-center">
                Upgrade
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Add bottom padding for mobile CTA */}
        <div className="h-20 sm:h-0"></div>
      </div>
    </div>
  );
};

export default UpgradePage;