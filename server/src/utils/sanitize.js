// Sanitization utility for user input
function sanitizeInput(input, maxLength = 255) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, maxLength);
}

// List of common disposable email domains (expand as needed)
const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'fakeinbox.com',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'mintemail.com',
  'throwawaymail.com',
  'emailondeck.com',
  'spamgourmet.com',
  'mailnesia.com',
  'mytemp.email',
  'moakt.com',
  'temp-mail.org',
  'tempail.com',
  'mailcatch.com',
];

function isDisposableEmailDomain(email) {
  if (typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

const crypto = require('crypto');

function generateDeviceFingerprint(req) {
  const components = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
  ];
  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
}

module.exports = {
  sanitizeInput,
  isDisposableEmailDomain,
  generateDeviceFingerprint,
};
