/**
 * Environment Variable Validator
 * Validates critical environment variables on startup.
 * Fails fast before the server starts accepting requests if critical secrets or configs are missing or insecure.
 */
export const validateEnv = () => {
  const errors = [];
  const warnings = [];

  const NODE_ENV = process.env.NODE_ENV || 'development';

  // 1. JWT_SECRET check
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required but not configured in environment variables');
  } else {
    // Minimum 16 chars in dev, 32 chars in production
    if (NODE_ENV === 'production' && jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    } else if (jwtSecret.length < 8) {
      errors.push('JWT_SECRET is too short (must be at least 8 characters long)');
    }

    const weakSecrets = ['secret', 'jwtsecret', 'password', '123456', 'pulsechat_secret'];
    if (weakSecrets.includes(jwtSecret.toLowerCase())) {
      if (NODE_ENV === 'production') {
        errors.push(`Insecure JWT_SECRET "${jwtSecret}" is forbidden in production`);
      } else {
        warnings.push(`Warning: JWT_SECRET "${jwtSecret}" is a common default. Consider setting a strong random secret.`);
      }
    }
  }

  // 2. MONGODB_URI check
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    errors.push('MONGODB_URI is required but not configured in environment variables');
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
  }

  // 3. PORT check
  const port = process.env.PORT;
  if (port) {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push(`Invalid PORT "${port}": Must be a number between 1 and 65535`);
    }
  }

  // 4. CLIENT_URL check
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl && !clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
    warnings.push(`CLIENT_URL "${clientUrl}" should start with http:// or https://`);
  }

  if (warnings.length > 0) {
    warnings.forEach((warn) => console.warn(`⚠️  [Config Warning] ${warn}`));
  }

  if (errors.length > 0) {
    console.error('====================================================');
    console.error('❌ FATAL ENVIRONMENT CONFIGURATION ERRORS:');
    errors.forEach((err) => console.error(`   • ${err}`));
    console.error('====================================================');
    throw new Error(`Environment validation failed: ${errors.join('; ')}`);
  }

  return { isValid: true };
};

export default validateEnv;
