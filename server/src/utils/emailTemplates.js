/**
 * Premium Email Templates Utility (Medium-Style Design)
 * Generates responsive, modern HTML emails with a clean, editorial aesthetic.
 */

const config = {
    colors: {
        primary: '#000000', // Black (Medium style)
        secondary: '#1A8917', // Medium Green
        background: '#FFFFFF', // White background
        surface: '#FFFFFF',
        text: '#242424', // Dark Gray
        textLight: '#757575', // Medium Gray
        border: '#F2F2F2', // Light Gray
        link: '#1A8917', // Medium Green for links
    },
    company: {
        name: 'VocalInk',
        logo: process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x40?text=VocalInk',
        address: 'Pune, Maharashtra',
    }
};

/**
 * Generates the full HTML email with the given content
 */
const generateEmailHtml = ({
    title,
    content,
    actionText,
    actionUrl,
    previewText = '',
    themeColor = config.colors.primary
}) => {
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Inter:wght@400;500;600&display=swap');
    
    /* Reset & Basics */
    body { margin: 0; padding: 0; background-color: #FFFFFF; color: #242424; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    a { color: inherit; text-decoration: none; }
    
    /* Layout */
    .wrapper { width: 100%; max-width: 680px; margin: 0 auto; padding: 40px 20px; }
    
    /* Header */
    .header { padding-bottom: 40px; border-bottom: 1px solid #F2F2F2; margin-bottom: 40px; text-align: center; }
    .logo { height: 32px; width: auto; }
    
    /* Typography */
    h1 { font-family: 'Merriweather', serif; font-size: 32px; font-weight: 700; margin: 0 0 24px; color: #000000; letter-spacing: -0.02em; line-height: 1.2; }
    p { font-size: 18px; margin: 0 0 24px; color: #242424; font-weight: 400; line-height: 1.6; }
    
    /* Components */
    .button-container { margin: 40px 0; text-align: center; }
    .button { 
      display: inline-block; 
      background-color: #000000; 
      color: #FFFFFF !important; 
      padding: 14px 32px; 
      border-radius: 9999px; /* Pill shape */
      font-family: 'Inter', sans-serif;
      font-size: 16px; 
      font-weight: 500; 
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .button:hover { opacity: 0.9; }
    
    .code-block { background-color: #F9F9F9; padding: 32px; text-align: center; margin: 32px 0; border-radius: 4px; }
    .verification-code { font-family: 'Inter', monospace; font-size: 36px; font-weight: 700; letter-spacing: 4px; color: #000000; }
    
    .info-box { background-color: #F9F9F9; padding: 24px; border-radius: 4px; margin: 24px 0; border-left: 4px solid #000000; }
    
    /* Footer */
    .footer { padding-top: 40px; border-top: 1px solid #F2F2F2; text-align: center; }
    .footer-text { font-size: 14px; color: #757575; margin-bottom: 12px; }
    .footer-links a { color: #757575; text-decoration: underline; margin: 0 10px; font-size: 14px; }
    
    /* Mobile */
    @media screen and (max-width: 600px) {
      .wrapper { padding: 20px; }
      h1 { font-size: 28px; }
      p { font-size: 16px; }
      .verification-code { font-size: 28px; letter-spacing: 2px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${previewText}
    </div>
    
    <div class="header">
      <img src="${config.company.logo}" alt="${config.company.name}" class="logo">
    </div>
    
    <div class="content">
      <h1>${title}</h1>
      
      ${content}
      
      ${actionUrl && actionText ? `
      <div class="button-container">
        <a href="${actionUrl}" class="button" target="_blank">${actionText}</a>
      </div>
      ` : ''}
      
      <p style="font-size: 14px; color: #757575; margin-top: 40px;">
        Button not working? Paste this link into your browser:<br>
        <a href="${actionUrl}" style="color: ${config.colors.link}; word-break: break-all;">${actionUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">&copy; ${year} ${config.company.name}. All rights reserved.</p>
      <div class="footer-links">
        <a href="${process.env.FRONTEND_URL}/privacy">Privacy</a>
        <a href="${process.env.FRONTEND_URL}/terms">Terms</a>
        <a href="mailto:asakashsahu20@gmail.com">Support</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
    generateEmailHtml,
    config
};
