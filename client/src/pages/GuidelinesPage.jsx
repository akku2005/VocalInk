import React from 'react';

const GuidelinesPage = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="glassmorphism-card p-8 md:p-12 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center font-poppins">
                    Community Guidelines
                </h1>

                <div className="article-content">
                    <p className="text-lg mb-6">Last updated: {new Date().toLocaleDateString()}</p>
                    <p className="mb-8">
                        VocalInk is a community dedicated to sharing knowledge, stories, and ideas. To ensure a safe and welcoming environment for everyone, we ask all members to adhere to the following guidelines.
                    </p>

                    <h2>1. Be Respectful and Kind</h2>
                    <p>
                        Treat others with respect. Constructive criticism and healthy debate are welcome, but harassment, bullying, insults, and personal attacks are strictly prohibited. We are a diverse community, and kindness goes a long way.
                    </p>

                    <h2>2. Zero Tolerance for Hate Speech</h2>
                    <p>
                        We do not tolerate content that promotes violence, discrimination, or hatred against individuals or groups based on race, ethnicity, religion, disability, gender, age, sexual orientation, or gender identity. Such content will be removed immediately, and accounts may be banned.
                    </p>

                    <h2>3. No Sexual or Explicit Content</h2>
                    <p>
                        VocalInk is not a platform for sexually explicit material or pornography. Content that is gratuitously sexual or obscene is not allowed. Artistic or educational context will be evaluated on a case-by-case basis.
                    </p>

                    <h2>4. Respect Intellectual Property</h2>
                    <p>
                        Share only content that you have created or have the right to use. Do not post copyrighted material without permission. Plagiarism—claiming others' work as your own—is strictly prohibited and will result in content removal.
                    </p>

                    <h2>5. No Spam or Deceptive Practices</h2>
                    <p>
                        Do not use VocalInk to send unsolicited messages, spam comments, or misleading links. Scams, phishing attempts, and deceptive marketing practices are forbidden. Automated posting and engagement manipulation are also prohibited.
                    </p>

                    <h2>6. Privacy and Safety</h2>
                    <p>
                        Do not publish other people's private information (doxing) without their express permission. This includes phone numbers, addresses, and private correspondence. Do not threaten or encourage self-harm or violence.
                    </p>

                    <h2>7. Consequences of Violations</h2>
                    <p>
                        If you violate these guidelines, we may take action including:
                    </p>
                    <ul>
                        <li>Removing the offending content</li>
                        <li>Issuing a warning</li>
                        <li>Suspending your account temporarily</li>
                        <li>Permanently banning your account</li>
                    </ul>
                    <p>
                        If you see content that violates these guidelines, please report it to our moderation team using the "Report" feature or contact support.
                    </p>

                    <h2>8. Contact Us</h2>
                    <p>
                        If you have questions about these guidelines, please contact us at:
                    </p>
                    <address className="not-italic mt-4 p-4 bg-surface rounded-lg border border-border">
                        <strong>VocalInk Safety Team</strong><br />
                        support@vocalink.com
                    </address>
                </div>
            </div>
        </div>
    );
};

export default GuidelinesPage;
