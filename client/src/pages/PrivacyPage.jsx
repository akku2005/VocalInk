import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="glassmorphism-card p-8 md:p-12 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center font-poppins">
                    Privacy Policy
                </h1>

                <div className="article-content">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to VocalInk ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at support@vocalink.com.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <p>
                        We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
                    </p>
                    <ul>
                        <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; passwords; and other similar information.</li>
                        <li><strong>Social Media Login Data:</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, Twitter or other social media account.</li>
                    </ul>

                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                    </p>
                    <ul>
                        <li>To facilitate account creation and logon process.</li>
                        <li>To send you marketing and promotional communications.</li>
                        <li>To send administrative information to you.</li>
                        <li>To protect our Services.</li>
                    </ul>

                    <h2>4. Sharing Your Information</h2>
                    <p>
                        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                    </p>

                    <h2>5. Security of Your Information</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>

                    <h2>6. Contact Us</h2>
                    <p>
                        If you have questions or comments about this policy, you may email us at support@vocalink.com or by post to:
                    </p>
                    <address className="not-italic mt-4 p-4 bg-surface rounded-lg border border-border">
                        <strong>VocalInk Inc.</strong><br />
                        123 Innovation Drive<br />
                        Tech City, TC 90210<br />
                        United States
                    </address>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
