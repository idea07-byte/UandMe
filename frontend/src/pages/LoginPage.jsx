import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { validateUsernameOrEmail, validatePassword } from '../utils/validators';
import authService from '../services/authService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  // Initialize fields, restoring remembered email if present
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    const remembered = authService.getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Real-time client-side field validation
  const validateField = (field, value) => {
    let error = null;
    if (field === 'email') {
      error = validateUsernameOrEmail(value);
    } else if (field === 'password') {
      error = validatePassword(value);
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') validateField('email', email);
    if (field === 'password') validateField('password', password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    setTouched({ email: true, password: true });

    if (emailErr || passErr) {
      toast.warning('Please correct the validation errors in the form.');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await login({ email, password, rememberMe });
      toast.success(`Welcome back, ${user.name}!`, 'Sign In Successful');
      const destination = location.state?.from || '/chat';
      navigate(destination, { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Authentication failed. Please verify credentials.';
      setServerError(errMsg);
      toast.error(errMsg, 'Authentication Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-soft-lg transition-colors">
      {/* Brand & Heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-soft">
            <MessageSquare className="w-5 h-5 fill-current/20" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-charcoal-900 dark:text-white leading-tight">
              Pulse<span className="text-primary-600 dark:text-primary-400">Chat</span>
            </h1>
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">
              Secure Student Messaging
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Enter your credentials to access your real-time chat workspace.
        </p>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-slide-down"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Sign In</p>
            <p className="opacity-90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Username / Email Field */}
        <Input
          id="login-email"
          name="email"
          label="Username or Email"
          type="text"
          placeholder="e.g. testuser1 or name@example.com"
          required
          autoComplete="username email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched.email) validateField('email', e.target.value);
          }}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : null}
          leftIcon={<Mail className="w-4 h-4" />}
          autoFocus
        />

        {/* Password Field */}
        <div>
          <Input
            id="login-password"
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) validateField('password', e.target.value);
            }}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : null}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="flex items-center justify-between text-xs pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal-600 dark:text-charcoal-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 dark:bg-charcoal-800 dark:border-charcoal-700"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-3"
        >
          Sign In
        </Button>
      </form>

      {/* Registration Link */}
      <p className="text-center text-xs text-charcoal-500 dark:text-charcoal-400 mt-6">
        Don&apos;t have an account yet?{' '}
        <Link
          to="/register"
          className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
