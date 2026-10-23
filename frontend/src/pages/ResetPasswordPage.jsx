import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import PasswordStrengthIndicator from '../components/forms/PasswordStrengthIndicator';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { validatePassword, validatePasswordMatch } from '../utils/validators';
import authService from '../services/authService';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'demo_token_pulsechat';
  const navigate = useNavigate();
  const toast = useToast();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validateField = (field, value, extra) => {
    let error = null;
    if (field === 'newPassword') {
      error = validatePassword(value);
    } else if (field === 'confirmPassword') {
      error = validatePasswordMatch(extra || newPassword, value);
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'newPassword') {
      validateField('newPassword', newPassword);
      if (touched.confirmPassword) validateField('confirmPassword', confirmPassword, newPassword);
    }
    if (field === 'confirmPassword') {
      validateField('confirmPassword', confirmPassword, newPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const passErr = validateField('newPassword', newPassword);
    const matchErr = validateField('confirmPassword', confirmPassword, newPassword);
    setTouched({ newPassword: true, confirmPassword: true });

    if (passErr || matchErr) {
      toast.warning('Please resolve validation errors before resetting.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
      toast.success('Your password has been reset successfully!', 'Password Changed');
    } catch (err) {
      setServerError(err.message || 'Password reset failed. Backend may be offline.');
      toast.error('Reset request failed. Backend offline or token expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSimulate = () => {
    authService.dev.simulateResetPassword(newPassword);
    setIsSuccess(true);
    toast.info('Simulated password reset in Sandbox Mode.', 'Dev Mode');
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
              Password Reset
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Set new password
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          {isSuccess
            ? 'Your credentials have been securely updated.'
            : 'Enter a strong, secure password for your student account.'}
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div className="space-y-6 animate-fade-in text-center">
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-emerald-glow">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
              Password Reset Complete
            </h3>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed max-w-sm mx-auto">
              Your password has been changed. You can now use your new credentials to sign into PulseChat.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/login')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Sign In
          </Button>
        </div>
      ) : (
        /* Reset Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-slide-down"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Reset Failed</p>
                <p className="opacity-90 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Token info badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-charcoal-100 dark:bg-charcoal-800 text-[11px] text-charcoal-600 dark:text-charcoal-400">
            <KeyRound className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span className="truncate">Recovery Token: <code className="font-mono text-primary-600 dark:text-primary-400">{token.substring(0, 18)}...</code></span>
          </div>

          {/* New Password */}
          <div>
            <Input
              id="reset-new-password"
              name="newPassword"
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (touched.newPassword) validateField('newPassword', e.target.value);
                if (touched.confirmPassword) {
                  validateField('confirmPassword', confirmPassword, e.target.value);
                }
              }}
              onBlur={() => handleBlur('newPassword')}
              error={touched.newPassword ? errors.newPassword : null}
              leftIcon={<Lock className="w-4 h-4" />}
              autoFocus
            />

            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* Confirm New Password */}
          <Input
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (touched.confirmPassword) {
                validateField('confirmPassword', e.target.value, newPassword);
              }
            }}
            onBlur={() => handleBlur('confirmPassword')}
            error={touched.confirmPassword ? errors.confirmPassword : null}
            leftIcon={<Lock className="w-4 h-4" />}
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
            Update Password
          </Button>

          {/* Sandbox Simulation */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={handleDevSimulate}
              className="text-xs text-charcoal-500 hover:text-charcoal-700"
            >
              🧪 Simulate Password Reset Success (Frontend Demo)
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

export default ResetPasswordPage;
