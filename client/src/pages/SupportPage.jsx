import React, { useState } from 'react';
import api from '../services/api';

const SupportPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/support', formData);
            setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send message. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const faqs = [
        {
            question: "How do I reset my password?",
            answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page. We'll send you an email with instructions."
        },
        {
            question: "Can I change my username?",
            answer: "Currently, usernames are permanent to ensure platform integrity. However, you can change your display name in your profile settings."
        },
        {
            question: "How do I report a bug?",
            answer: "Please use the contact form on this page to report any issues. Include as much detail as possible, including screenshots if available."
        }
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold text-primary mb-4 font-poppins">How can we help?</h1>
                <p className="text-xl text-text-secondary">We're here to help and answer any question you might have.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div className="glassmorphism-card p-8 animate-slide-in">
                    <h2 className="text-2xl font-bold mb-6 text-text-primary font-poppins">Send us a message</h2>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-lg ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary disabled:opacity-50"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary disabled:opacity-50"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary disabled:opacity-50"
                                placeholder="How can we help?"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                rows="4"
                                className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary resize-none disabled:opacity-50"
                                placeholder="Tell us more about your inquiry..."
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>

                {/* FAQ & Info */}
                <div className="space-y-8 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    {/* Contact Info */}
                    <div className="glassmorphism-card p-8">
                        <h2 className="text-2xl font-bold mb-6 text-text-primary font-poppins">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary">Email</h3>
                                    <p className="text-text-secondary">asakashsahu20@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary">Phone</h3>
                                    <p className="text-text-secondary">+91 7420987728</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary">Location</h3>
                                    <p className="text-text-secondary">Pune, Maharashtra</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="glassmorphism-card p-8">
                        <h2 className="text-2xl font-bold mb-6 text-text-primary font-poppins">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                                    <h3 className="font-semibold text-text-primary mb-2">{faq.question}</h3>
                                    <p className="text-text-secondary text-sm">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
