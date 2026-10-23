/**
 * Form Validation & Input Sanitization Utilities (Zero-dependency)
 * Enforces clean input masking and user-friendly error messages
 */

// 1. ACTIVE INPUT SANITIZERS (Used in onChange handlers)

/**
 * Strips out numbers and disallowed special characters.
 * Allows only alphabets, spaces, hyphens, and apostrophes (e.g. "Mary-Jane", "O'Connor").
 * Limits to 50 characters.
 */
export const sanitizeName = (value = '') => {
  return String(value)
    .replace(/[^a-zA-Z\s'-]/g, '')
    .slice(0, 50);
};

/**
 * Strips out any non-digit character and restricts length strictly to 10 digits.
 */
export const sanitizePhone = (value = '') => {
  return String(value)
    .replace(/\D/g, '')
    .slice(0, 10);
};

/**
 * Trims leading/trailing whitespace.
 */
export const sanitizeEmail = (value = '') => {
  return String(value).trim().toLowerCase();
};

// 2. SEMANTIC VALIDATORS (Used on Submit / Blur)

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters long.';
  }
  // Must contain only letters, spaces, hyphens, apostrophes
  const nameRegex = /^[A-Za-z\s'-]{2,50}$/;
  if (!nameRegex.test(trimmed)) {
    return 'Name must contain letters only (no numbers or special symbols).';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return 'Phone number is required.';
  }
  const cleanPhone = phone.trim();
  if (cleanPhone.length !== 10) {
    return 'Phone number must be exactly 10 digits.';
  }
  // Standard Indian 10-digit mobile numbers start with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return 'Please enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9).';
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};
