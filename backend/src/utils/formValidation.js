/**
 * Server-side Form Validation & Sanitization Helpers
 */

export const sanitizeName = (value = "") => {
  return String(value)
    .replace(/[^a-zA-Z\s'-]/g, "")
    .slice(0, 50);
};

export const sanitizePhone = (value = "") => {
  return String(value).replace(/\D/g, "").slice(0, 10);
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return "Full name is required.";
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters long.";
  }
  const nameRegex = /^[A-Za-z\s'-]{2,50}$/;
  if (!nameRegex.test(trimmed)) {
    return "Name must contain letters only (no numbers or special symbols).";
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Phone number is required.";
  }
  const cleanPhone = phone.trim();
  if (cleanPhone.length !== 10) {
    return "Phone number must be exactly 10 digits.";
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return "Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email address is required.";
  }
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return "Please provide a valid email address.";
  }
  return null;
};
