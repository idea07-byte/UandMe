import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ArrowLeft, ArrowRight, CheckCircle2, RotateCw, AlertCircle, ExternalLink } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { validateEmail } from '../utils/validators';
import authService from '../services/authService';

export const ForgotPasswordPage = () => {
  const toast = useToast();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const emailErr = validateEmail(email);
    setError(emailErr);
    setTouched(true);

    if (emailErr) {
      toast.warning('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      toast.success(`Password reset instructions sent to ${email}`, 'Email Dispatched');
    } catch (err) {
      // In dev mode or backend offline, inform the user and provide option to simulate
      setServerError(err.message || 'Could not send reset email. Backend is offline.');
      toast.error('Backend offline. You can test the success confirmation state in Dev Mode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSimulate = () => {
    const demoEmail = email.trim() || 'student@university.edu';
    setEmail(demoEmail);
    authService.dev.simulateForgotPassword(demoEmail);
    setIsSubmitted(true);
    toast.info('Simulated password reset email sent in Sandbox Mode.', 'Dev Mode');
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
              Account Recovery
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Forgot your password?
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1 leading-relaxed">
          {isSubmitted
            ? 'We have dispatched password recovery instructions to your email.'
            : 'Enter your registered email address and we’ll send you a secure link to reset your credentials.'}
        </p>
      </div>

      {/* Success Confirmation State */}
      {isSubmitted ? (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-soft">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Check Your Inbox
              </h3>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 mt-1">
                We sent a password reset link to: <strong className="font-semibold">{email}</strong>
              </p>
            </div>
            <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
              Did not receive the email? Check your spam folder or wait 60 seconds to resend.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                setIsSubmitted(false);
                toast.info('You can enter a different email address.');
              }}
              leftIcon={<RotateCw className="w-4 h-4" />}
            >
              Try Another Email
            </Button>

            {/* Direct Link to Reset Password */}
            <Link to="/reset-password?token=demo_reset_token_2026">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                Go Directly to Reset Password UI (Test Link)
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-slide-down"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Request Failed</p>
                <p className="opacity-90 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <Input
            id="forgot-email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="student@university.edu"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) setError(validateEmail(e.target.value));
            }}
            onBlur={handleBlur}
            error={touched ? error : null}
            leftIcon={<Mail className="w-4 h-4" />}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="mt-2"
          >
            Send Reset Link
          </Button>

          {/* Sandbox simulation button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={handleDevSimulate}
              className="text-xs text-charcoal-500 hover:text-charcoal-700"
            >
              🧪 Simulate Success Confirmation (Frontend Demo)
            </Button>
          </div>
        </form>
      )}

      {/* Back to Login */}
      <div className="mt-6 pt-5 border-t border-charcoal-100 dark:border-charcoal-800 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
