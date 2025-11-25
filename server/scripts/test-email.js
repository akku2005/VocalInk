require('dotenv').config();
const EmailService = require('../src/services/EmailService');

async function test() {
    const email = 'asakashsahu20@gmail.com';
    console.log(`Sending ALL test emails to ${email}...`);

    try {
        // 1. Verification
        console.log('1. Sending Verification Email...');
        await EmailService.sendVerificationEmail(email, '123456');

        // 2. Password Reset
        console.log('2. Sending Password Reset Email...');
        await EmailService.sendPasswordResetEmail(email, '987654');

        // 3. Verification Success
        console.log('3. Sending Verification Success Email...');
        await EmailService.sendVerificationSuccessEmail(email, 'Asakash');

        // 4. Admin Creation
        console.log('4. Sending Admin Creation Notification...');
        await EmailService.sendAdminCreationNotification(email, 'New Admin User', 'Super Admin');

        // 5. Security Alert
        console.log('5. Sending Security Alert Email...');
        await EmailService.sendSecurityAlertEmail(
            { email },
            { type: 'Suspicious Login', timestamp: new Date().toLocaleString(), ipAddress: '192.168.1.1', userAgent: 'Chrome on Windows' }
        );

        // 6. Password Change
        console.log('6. Sending Password Change Notification...');
        await EmailService.sendPasswordChangeNotification(email);

        // 7. Account Lockout
        console.log('7. Sending Account Lockout Notification...');
        await EmailService.sendAccountLockoutNotification(email, new Date(Date.now() + 30 * 60000));

        // 8. Collaboration Invitation
        console.log('8. Sending Collaboration Invitation...');
        await EmailService.sendCollaborationInvitationEmail(email, 'John Doe', 'Tech Trends 2025', 'http://localhost:3000/collab/invite/123');

        console.log('✅ All emails sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
    process.exit();
}

test();
