import React from 'react';

const TermsPage = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="glassmorphism-card p-8 md:p-12 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center font-poppins">
                    Terms of Service
                </h1>

                <div className="article-content">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Agreement to Terms</h2>
                    <p>
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and VocalInk ("we," "us" or "our"), concerning your access to and use of the VocalInk website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                    </p>

                    <h2>2. Intellectual Property Rights</h2>
                    <p>
                        Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>

                    <h2>3. User Representations</h2>
                    <p>
                        By using the Site, you represent and warrant that:
                    </p>
                    <ul>
                        <li>All registration information you submit will be true, accurate, current, and complete.</li>
                        <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                        <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                        <li>You are not a minor in the jurisdiction in which you reside.</li>
                    </ul>

                    <h2>4. Prohibited Activities</h2>
                    <p>
                        You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                    </p>

                    <h2>5. User Generated Contributions</h2>
                    <p>
                        The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions").
                    </p>

                    <h2>6. Termination</h2>
                    <p>
                        These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
                    </p>

                    <h2>7. Contact Us</h2>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
                    </p>
                    <address className="not-italic mt-4 p-4 bg-surface rounded-lg border border-border">
                        <strong>VocalInk Inc.</strong><br />
                        support@vocalink.com
                    </address>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
