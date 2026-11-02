import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Smartphone,
  KeyRound,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import PhoneInput from '../components/common/PhoneInput';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { validateUsernameOrEmail, validatePassword } from '../utils/validators';
import { normalizePhone } from '../utils/phoneUtils';
import authService from '../services/authService';
import { cn } from '../utils/cn';

/**
 * WhatsApp-style Authentication Page with Phone Number + OTP and Email login tabs.
 * - Tab 1: Phone number (Default +91) + 6-digit OTP verification (Native WhatsApp login flow)
 * - Tab 2: Username / Email + Password login
 * - Real-time validation, automatic country picker, and cloud spin-up resilience
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  // Active Login Method Tab: 'phone' | 'email'
  const [activeTab, setActiveTab] = useState('phone');

  // ----------------------------------------------------
  // Phone + OTP State
  // ----------------------------------------------------
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // ----------------------------------------------------
  // Email + Password State
  // ----------------------------------------------------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation and network error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Load remembered email
  useEffect(() => {
    const remembered = authService.getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // OTP Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Server cold-start helper timer
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsWakingUp(true);
      }, 2500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // ----------------------------------------------------
  // Handlers for Phone + OTP
  // ----------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError(null);

    const normalized = normalizePhone(phone, countryCode.replace('+', ''));
    if (!normalized.isValid) {
      setErrors((prev) => ({ ...prev, phone: normalized.error || 'Please enter a valid phone number' }));
      return;
    }
    setErrors((prev) => ({ ...prev, phone: null }));

    setIsLoading(true);
    try {
      const res = await sendPhoneOtp(normalized.e164, countryCode);
      setIsNewUser(!res.isRegistered);
      setDevOtpHint(res.debugOtp || null);
      setPhoneStep('otp');
      setResendCooldown(45);
      toast.success(
        res.message || `Verification code sent to ${normalized.formatted}`,
        'Code Sent'
      );
    } catch (err) {
      const msg = err.message || 'Failed to send verification code. Please check your phone number.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter the 6-digit verification code' }));
      return;
    }

    if (isNewUser && !name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Please enter your name to complete sign up' }));
      return;
    }

    const normalized = normalizePhone(phone, countryCode.replace('+', ''));
    setIsLoading(true);
    try {
      const res = await verifyPhoneOtp({
        phone: normalized.e164,
        otp: cleanOtp,
        name: isNewUser ? name.trim() : undefined,
        countryCode,
      });

      toast.success(
        res.isNewUser
          ? `Welcome to uandi, ${res.user.name}!`
          : `Welcome back, ${res.user.name}!`,
        'Signed In Successfully'
      );

      const destination = location.state?.from || '/chat';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid or expired verification code.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handlers for Email + Password
  // ----------------------------------------------------
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

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
    <div className="bg-white dark:bg-[#111B21] border border-charcoal-200 dark:border-[#222D34] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors">
      {/* Brand Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#00A884] flex items-center justify-center text-white shadow-soft">
            <MessageSquare className="w-6 h-6 fill-current/20" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-charcoal-900 dark:text-[#E9EDEF] leading-tight">
              uand<span className="text-[#00A884]">i</span>
            </h1>
            <p className="text-[11px] font-semibold text-charcoal-400 dark:text-[#8696A0] uppercase tracking-wider">
              End-to-End Encrypted Messaging
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-charcoal-900 dark:text-[#E9EDEF] tracking-tight">
          Welcome to uandi
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-[#8696A0] mt-1">
          {activeTab === 'phone'
            ? 'Sign in or create your account using your mobile phone number.'
            : 'Enter your credentials to access your real-time chat workspace.'}
        </p>
      </div>

      {/* Tab Selector: Phone (WhatsApp style) vs Email */}
      <div className="flex rounded-2xl bg-charcoal-100 dark:bg-[#202C33] p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('phone');
            setServerError(null);
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all',
            activeTab === 'phone'
              ? 'bg-white dark:bg-[#111B21] text-[#00A884] shadow-sm'
              : 'text-charcoal-600 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-[#E9EDEF]'
          )}
        >
          <Smartphone className="w-4 h-4" />
          <span>Phone Number</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('email');
            setServerError(null);
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all',
            activeTab === 'email'
              ? 'bg-white dark:bg-[#111B21] text-[#00A884] shadow-sm'
              : 'text-charcoal-600 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-[#E9EDEF]'
          )}
        >
          <Mail className="w-4 h-4" />
          <span>Email & Password</span>
        </button>
      </div>

      {/* Cloud Server Cold-Start Notification */}
      {isWakingUp && (
        <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Connecting to secure cloud server...</span>
            <span className="text-[11px] block text-amber-700/80 dark:text-amber-300/80">
              The service may take a few moments to spin up. Please hold on.
            </span>
          </div>
        </div>
      )}

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

      {/* TAB 1: PHONE NUMBER + OTP */}
      {activeTab === 'phone' && (
        <div>
          {phoneStep === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <PhoneInput
                label="Mobile Phone Number"
                required
                countryCode={countryCode}
                onCountryChange={(dial) => setCountryCode(dial)}
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
                error={errors.phone}
                autoFocus
              />

              <p className="text-[11px] text-charcoal-500 dark:text-[#8696A0] leading-relaxed">
                We will send you a 6-digit one-time verification code via SMS to verify your mobile number. Standard rates may apply.
              </p>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="mt-2"
                disabled={isLoading || !phone.trim()}
              >
                {isLoading ? 'Sending Code...' : 'Next'}
              </Button>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-2xl bg-charcoal-50 dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-charcoal-400 dark:text-[#8696A0] uppercase font-bold block">
                    Verifying Number
                  </span>
                  <span className="font-bold text-charcoal-900 dark:text-[#E9EDEF] font-mono">
                    {countryCode} {phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('phone');
                    setOtp('');
                    setServerError(null);
                  }}
                  className="text-xs font-semibold text-[#00A884] hover:underline"
                >
                  Edit number
                </button>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-[#8696A0] mb-1.5">
                  Enter 6-Digit Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                    }}
                    placeholder="1 2 3 4 5 6"
                    className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-3 px-4 rounded-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] focus:outline-none focus:border-[#00A884] transition-colors"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errors.otp && (
                  <p className="text-xs text-rose-500 mt-1">{errors.otp}</p>
                )}

                {/* Dev OTP Hint */}
                {devOtpHint && (
                  <p className="text-[11px] text-[#00A884] font-medium mt-1">
                    Demo OTP Code: <span className="font-bold font-mono">{devOtpHint}</span>
                  </p>
                )}
              </div>

              {/* If New User: Ask for display name */}
              {isNewUser && (
                <div className="animate-fade-in pt-1">
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-[#8696A0] mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. Alex Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] text-sm focus:outline-none focus:border-[#00A884]"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                  )}
                  <p className="text-[10px] text-charcoal-400 dark:text-[#8696A0] mt-1">
                    This name will be visible to your uandi contacts.
                  </p>
                </div>
              )}

              {/* Resend Code Button & Countdown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className="flex items-center gap-1.5 font-semibold text-[#00A884] hover:underline disabled:text-charcoal-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('phone');
                    setOtp('');
                  }}
                  className="text-charcoal-500 dark:text-[#8696A0] hover:text-charcoal-800 dark:hover:text-white"
                >
                  Change number
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="mt-3"
                disabled={isLoading || otp.trim().length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: EMAIL & PASSWORD */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
          <Input
            id="login-email"
            name="email"
            label="Username or Email"
            type="text"
            placeholder="e.g. name@example.com"
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
      )}

      {/* Registration Link */}
      <p className="text-center text-xs text-charcoal-500 dark:text-[#8696A0] mt-6">
        Don&apos;t have an account yet?{' '}
        <Link
          to="/register"
          className="font-bold text-[#00A884] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
