const crypto = require('crypto');
const User = require('../models/user.model');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_REGEX = /^[a-z0-9._]+$/;

const sanitizeUsername = (value) => {
  if (!value || typeof value !== 'string') return '';

  // Normalize and lowercase
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase();

  const filtered = normalized
    .replace(/[^a-z0-9._]/g, '') // Allow letters, numbers, dots, underscores
    .replace(/[\._]{2,}/g, (match) => match[0]) // Collapse repeated dots/underscores
    .replace(/^[._]+|[._]+$/g, ''); // Trim leading/trailing dots/underscores

  const truncated = filtered.slice(0, USERNAME_MAX_LENGTH);
  if (truncated.length < USERNAME_MIN_LENGTH) return '';
  return truncated;
};

const generateUsernameBase = (firstName, lastName) => {
  const persona = `${firstName || ''}${lastName || ''}`.trim();
  const sanitizedPersona = sanitizeUsername(persona);
  if (sanitizedPersona) {
    return sanitizedPersona;
  }

  // Fallback to random handle
  return `user${crypto.randomBytes(3).toString('hex')}`;
};

const ensureUniqueUsername = async (baseCandidate) => {
  let base = sanitizeUsername(baseCandidate) || generateUsernameBase();
  let candidate = base;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }
    candidate = `${base}${attempt + 1}`;
  }

  // Last resort random suffix
  while (true) {
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    candidate = `${base}${randomSuffix}`.slice(0, USERNAME_MAX_LENGTH);
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }
  }
};

const isValidUsername = (username) => USERNAME_REGEX.test(username);

module.exports = {
  sanitizeUsername,
  ensureUniqueUsername,
  generateUsernameBase,
  isValidUsername,
};
