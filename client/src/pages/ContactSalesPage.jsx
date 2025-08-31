import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  Building2,
  Users,
  Globe,
  Shield,
  BarChart3,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Palette,
  Lock,
  Headphones,
  Clock,
  Target,
  Rocket,
} from "lucide-react";

const ContactSalesPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    companySize: "",
    useCase: "",
    message: "",
    budget: "",
    timeline: "",
  });

  const [selectedUseCase, setSelectedUseCase] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");

  const useCases = [
    "Content Creation & Management",
    "Team Collaboration",
    "AI-Powered Writing",
    "Text-to-Speech Integration",
    "Gamification & Engagement",
    "Analytics & Insights",
    "Custom Branding",
    "API Integration",
    "White-label Solution",
    "Enterprise Security",
  ];

  const budgetRanges = [
    "Under $1,000/month",
    "$1,000 - $5,000/month",
    "$5,000 - $10,000/month",
    "$10,000 - $25,000/month",
    "$25,000+/month",
    "Custom pricing",
  ];

  const timelines = [
    "Immediate (within 30 days)",
    "Next quarter (1-3 months)",
    "Next 6 months",
    "Next year",
    "No specific timeline",
  ];

  const enterpriseFeatures = [
    {
      icon: Building2,
      title: "Enterprise-Grade Security",
      description: "SOC 2 compliance, SSO integration, advanced role-based access control, and comprehensive audit logging.",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Advanced user management, permission systems, and collaborative workflows for large teams.",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: Globe,
      title: "Global Infrastructure",
      description: "Multi-region deployment, CDN optimization, and 99.9% uptime SLA for worldwide teams.",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: Shield,
      title: "Custom Security",
      description: "Custom security policies, advanced threat detection, and dedicated security team support.",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Custom dashboards, advanced reporting, and predictive analytics for data-driven decisions.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      icon: Zap,
      title: "Custom Integrations",
      description: "API development, custom webhooks, and integration with your existing tech stack.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
  ];

  const benefits = [
    "Dedicated account manager",
    "Priority support (4-hour response time)",
    "Custom onboarding and training",
    "Quarterly business reviews",
    "Feature request prioritization",
    "Custom SLA agreements",
    "Advanced reporting and analytics",
    "White-label solutions",
    "Custom branding options",
    "API access and documentation",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact Sales Form Submitted:", formData);
    // TODO: Implement form submission logic
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Enterprise Solutions
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-[var(--text-color)] mb-6 leading-tight">
            Let's Build Something{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Amazing Together
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[var(--light-text-color)] max-w-3xl mx-auto leading-relaxed px-4">
            Ready to scale your content creation with enterprise-grade features? Our sales team is here to help 
            you find the perfect solution for your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[var(--text-color)] mb-2">
                  Get in Touch
                </CardTitle>
                <p className="text-[var(--light-text-color)]">
                  Tell us about your needs and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
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
                      placeholder="john@company.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Company Name *
                    </label>
                    <Input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      placeholder="Your Company Inc."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Primary Use Case *
                    </label>
                    <select
                      name="useCase"
                      value={formData.useCase}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select primary use case</option>
                      {useCases.map((useCase) => (
                        <option key={useCase} value={useCase}>
                          {useCase}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Budget Range
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select budget range</option>
                      {budgetRanges.map((budget) => (
                        <option key={budget} value={budget}>
                          {budget}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Implementation Timeline
                    </label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select timeline</option>
                      {timelines.map((timeline) => (
                        <option key={timeline} value={timeline}>
                          {timeline}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                      Tell us more about your needs
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe your specific requirements, challenges, and goals..."
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  >
                    Send Message
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise Features & Benefits */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Enterprise Features */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                Enterprise Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${feature.bgColor} flex-shrink-0`}>
                          <feature.icon className={`w-5 h-5 ${feature.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--text-color)] text-sm mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-[var(--light-text-color)] text-xs leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                What You'll Get
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-[var(--text-color)] text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-color)]">Email</div>
                    <div className="text-[var(--light-text-color)] text-sm">sales@vocalink.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-color)]">Phone</div>
                    <div className="text-[var(--light-text-color)] text-sm">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-color)]">Live Chat</div>
                    <div className="text-[var(--light-text-color)] text-sm">Available 24/7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">
                    Ready to Get Started?
                  </h3>
                  <p className="text-indigo-100 mb-4">
                    Schedule a personalized demo with our team and see how VocalInk can transform your content creation.
                  </p>
                  <Link to="/upgrade">
                    <Button
                      variant="outline"
                      size="md"
                      className="border-white text-white hover:bg-white hover:text-indigo-600"
                    >
                      View Pricing Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSalesPage; 