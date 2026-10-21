import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import PasswordStrengthIndicator from '../components/forms/PasswordStrengthIndicator';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../utils/validators';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, devRegister } = useAuth();

  // Form field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Field errors and blur states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Validate individual field
  const validateField = (field, value, extraValue) => {
    let error = null;
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validatePasswordMatch(extraValue || password, value);
        break;
      case 'terms':
        if (!value) error = 'You must agree to the Terms of Service to create an account.';
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'name') validateField('name', name);
    if (field === 'email') validateField('email', email);
    if (field === 'password') {
      validateField('password', password);
      if (touched.confirmPassword) validateField('confirmPassword', confirmPassword, password);
    }
    if (field === 'confirmPassword') validateField('confirmPassword', confirmPassword, password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    const confErr = validateField('confirmPassword', confirmPassword, password);
    const termsErr = validateField('terms', agreedToTerms);

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (nameErr || emailErr || passErr || confErr || termsErr) {
      toast.warning('Please fix the validation errors before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({ name, email, password });
      toast.success(
        res.message || `Welcome to PulseChat, ${name}! Your account has been registered.`,
        'Account Created'
      );
      // Route to email verification status or direct chat
      navigate('/verify-email', { state: { email, fromRegister: true } });
    } catch (err) {
      const errMsg = err.message || 'Registration could not be completed. Backend offline.';
      setServerError(errMsg);
      toast.error(errMsg, 'Registration Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevPreviewRegister = () => {
    const validName = name.trim() || 'Jordan Miller';
    const validEmail = email.trim() || 'jordan.miller@capstone.io';
    devRegister({ name: validName, email: validEmail });
    toast.info('Created student profile in Sandbox Preview Mode.', 'Dev Mode Active');
    navigate('/chat', { replace: true });
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
              Student Registration
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Join peers and collaborators on your campus messaging platform.
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
            <p className="font-semibold">Registration Issue</p>
            <p className="opacity-90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <Input
          id="register-name"
          name="name"
          label="Full Name"
          type="text"
          placeholder="Jordan Miller"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (touched.name) validateField('name', e.target.value);
          }}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : null}
          leftIcon={<User className="w-4 h-4" />}
          autoFocus
        />

        {/* Email */}
        <Input
          id="register-email"
          name="email"
          label="University or Team Email"
          type="email"
          placeholder="jordan.miller@university.edu"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched.email) validateField('email', e.target.value);
          }}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : null}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        {/* Password */}
        <div>
          <Input
            id="register-password"
            name="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) validateField('password', e.target.value);
              if (touched.confirmPassword) {
                validateField('confirmPassword', confirmPassword, e.target.value);
              }
            }}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : null}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {/* Dynamic Password Strength Indicator */}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password */}
        <Input
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (touched.confirmPassword) {
              validateField('confirmPassword', e.target.value, password);
            }
          }}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : null}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        {/* Terms and Conditions Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-charcoal-600 dark:text-charcoal-400">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (touched.terms) validateField('terms', e.target.checked);
              }}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 dark:bg-charcoal-800 dark:border-charcoal-700"
            />
            <span className="leading-snug">
              I agree to the{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('PulseChat Terms of Service standard for student capstone projects.');
                }}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('PulseChat Privacy Policy: Your data and messages are protected.');
                }}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {touched.terms && errors.terms && (
            <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.terms}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Create Free Account
        </Button>
      </form>

      {/* Dev Mode Sandbox Option */}
      <div className="mt-6 pt-5 border-t border-charcoal-100 dark:border-charcoal-800/80">
        <div className="p-3.5 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/50 border border-charcoal-200/60 dark:border-charcoal-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              Development Sandbox
            </span>
            <span className="text-[10px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-1.5 py-0.5 rounded">
              Local Test
            </span>
          </div>
          <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 leading-snug">
            Need to test registration without a running backend API? Use local sandbox registration.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleDevPreviewRegister}
          >
            Create Sandbox Account
          </Button>
        </div>
      </div>

      {/* Link to Login */}
      <p className="text-center text-xs text-charcoal-500 dark:text-charcoal-400 mt-6">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
