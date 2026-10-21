/**
 * Utility functions for frontend client-side validation.
 */

/**
 * Validates email format according to standard RFC patterns.
 * @param {string} email
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address (e.g., student@university.edu).';
  }
  return null;
}

/**
 * Validates either a username (min 3 chars) or an email address.
 * @param {string} identifier
 * @returns {string|null}
 */
export function validateUsernameOrEmail(identifier) {
  if (!identifier || !identifier.trim()) {
    return 'Username or email address is required.';
  }
  const val = identifier.trim();
  if (val.includes('@')) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }
  if (val.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  return null;
}

/**
 * Validates a user's full name.
 * @param {string} name
 * @returns {string|null}
 */
export function validateName(name) {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long.';
  }
  return null;
}

/**
 * Validates a password against basic security constraints.
 * @param {string} password
 * @returns {string|null}
 */
export function validatePassword(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}

/**
 * Validates matching confirmation password.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string|null}
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

/**
 * Calculates password strength and returns score, label, color, and requirement flags.
 * @param {string} password
 * @returns {{
 *   score: number, // 0 to 4
 *   label: 'Weak' | 'Fair' | 'Good' | 'Strong',
 *   color: string,
 *   barWidth: string,
 *   checks: {
 *     hasMinLength: boolean,
 *     hasLowerAndUpper: boolean,
 *     hasNumber: boolean,
 *     hasSpecial: boolean
 *   }
 * }}
 */
export function calculatePasswordStrength(password = '') {
  const checks = {
    hasMinLength: password.length >= 8,
    hasLowerAndUpper: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.hasMinLength) score += 1;
  if (checks.hasLowerAndUpper) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecial) score += 1;

  if (password.length === 0) {
    return {
      score: 0,
      label: 'Too Short',
      color: 'bg-charcoal-200 dark:bg-charcoal-700',
      textColor: 'text-charcoal-400',
      barWidth: 'w-0',
      checks,
    };
  }

  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Weak',
        color: 'bg-rose-500',
        textColor: 'text-rose-500',
        barWidth: 'w-1/4',
        checks,
      };
    case 2:
      return {
        score: 2,
        label: 'Fair',
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        barWidth: 'w-2/4',
        checks,
      };
    case 3:
      return {
        score: 3,
        label: 'Good',
        color: 'bg-emerald-400',
        textColor: 'text-emerald-500',
        barWidth: 'w-3/4',
        checks,
      };
    case 4:
    default:
      return {
        score: 4,
        label: 'Strong',
        color: 'bg-emerald-600',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        barWidth: 'w-full',
        checks,
      };
  }
}
