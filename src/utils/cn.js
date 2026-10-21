import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional CSS classes and merges conflicting Tailwind classes.
 * @param  {...any} inputs - Class names, expressions, or objects
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
