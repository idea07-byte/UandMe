import jwt from 'jsonwebtoken';

/**
 * Generate a cryptographically signed JSON Web Token (JWT)
 * @param {string|mongoose.Types.ObjectId} userId - User's MongoDB ObjectId
 * @returns {string} Signed JWT string
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

export default generateToken;
