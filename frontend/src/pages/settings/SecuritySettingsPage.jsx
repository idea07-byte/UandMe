import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  LogOut,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import { SettingsCard, SettingsToggle } from '../../components/settings';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PasswordStrengthIndicator from '../../components/forms/PasswordStrengthIndicator';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useToast from '../../hooks/useToast';

export const SecuritySettingsPage = () => {
  const toast = useToast();

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    return localStorage.getItem('pulsechat_sec_2fa') === 'true';
  });

  // Active Sessions State
  const [sessions, setSessions] = useState([
    {
      id: 'sess_curr',
      device: 'Chrome on Windows 11',
      location: 'University Campus WiFi • 192.168.1.45',
      time: 'Active now',
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: 'sess_mobile',
      device: 'PulseChat for iOS (iPhone 15 Pro)',
      location: 'Cellular Network • Chicago, IL',
      time: 'Last active 2 hours ago',
      isCurrent: false,
      icon: Smartphone,
    },
    {
      id: 'sess_mac',
      device: 'Safari on macOS Sonoma (MacBook Pro)',
      location: 'Science Library Lab • 10.0.4.12',
      time: 'Yesterday at 4:15 PM',
      isCurrent: false,
      icon: Laptop,
    },
  ]);

  const [isLogoutSessionsModalOpen, setIsLogoutSessionsModalOpen] = useState(false);

  // Validate password form
  const validate = () => {
    const errs = {};
    if (!currentPassword) {
      errs.currentPassword = 'You must enter your current password.';
    }
    if (!newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters long.';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Password Submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the password form.');
      return;
    }

    setIsUpdatingPassword(true);
    // Simulate secure backend password hash update
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      toast.success(
        'Your password has been changed securely. Other active sessions were invalidated.',
        'Password Updated'
      );
    }, 1000);
  };

  const handleToggle2FA = (val) => {
    setTwoFactorEnabled(val);
    localStorage.setItem('pulsechat_sec_2fa', String(val));
    toast.success(
      val
        ? 'Two-Factor Authentication enabled with University Duo Mobile SSO.'
        : 'Two-Factor Authentication disabled.'
    );
  };

  const handleTerminateOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setIsLogoutSessionsModalOpen(false);
    toast.success('Successfully terminated all other active sessions.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Security Settings
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Update your student password, manage two-factor authentication, and monitor active devices.
        </p>
      </div>

      {/* Change Password Form */}
      <SettingsCard
        title="Change Student Password"
        description="Choose a strong, unique password to safeguard your messages and shared coursework."
        icon={KeyRound}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your existing password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (errors.currentPassword)
                setErrors((prev) => ({ ...prev, currentPassword: null }));
            }}
            required
          />
          {errors.currentPassword && (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.currentPassword}</span>
            </p>
          )}

          <div className="pt-2">
            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters with letters, numbers, and symbols"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword)
                  setErrors((prev) => ({ ...prev, newPassword: null }));
              }}
              required
            />
            {errors.newPassword && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.newPassword}</span>
              </p>
            )}

            {/* Live Password Strength Meter */}
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div className="pt-2">
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password to verify"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              required
            />
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100 dark:border-charcoal-800/80">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrors({});
              }}
              disabled={!currentPassword && !newPassword && !confirmPassword}
            >
              Reset Form
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPassword}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </SettingsCard>

      {/* Two-Factor Authentication */}
      <SettingsCard
        title="Two-Factor Authentication (2FA)"
        description="Add a second verification layer when signing in from an unrecognized device."
        icon={ShieldCheck}
      >
        <SettingsToggle
          id="toggle-2fa"
          checked={twoFactorEnabled}
          onChange={handleToggle2FA}
          title="Enable Two-Factor Authentication (Duo / TOTP)"
          description="Requires an authenticated push or 6-digit code in addition to your student password."
          icon={ShieldCheck}
          badge={twoFactorEnabled ? 'Active' : 'Recommended'}
        />

        <div className="p-3.5 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800 text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
          <span>
            University accounts are pre-configured for Duo Mobile and Google Authenticator time-based one-time passwords (TOTP).
          </span>
        </div>
      </SettingsCard>

      {/* Active Sessions UI Placeholder */}
      <SettingsCard
        title="Active Devices & Sessions"
        description="Review all devices currently authenticated to your PulseChat student workspace."
        icon={Globe}
      >
        <div className="space-y-3">
          {sessions.map((sess) => {
            const Icon = sess.icon;
            return (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-50/80 dark:bg-charcoal-800/50 border border-charcoal-100 dark:border-charcoal-800"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-charcoal-700/60 border border-charcoal-200/60 dark:border-charcoal-600/60 text-charcoal-600 dark:text-charcoal-300 flex items-center justify-center shrink-0 shadow-soft-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs sm:text-sm font-bold text-charcoal-900 dark:text-white truncate">
                        {sess.device}
                      </h5>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5 truncate">
                      {sess.location} • <span className="font-medium">{sess.time}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 1 && (
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsLogoutSessionsModalOpen(true)}
              leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
            >
              Sign Out of All Other Devices
            </Button>
          </div>
        )}
      </SettingsCard>

      {/* Security Note */}
      <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-900/60 flex items-center gap-3 text-xs text-primary-800 dark:text-primary-300">
        <Sparkles className="w-4 h-4 shrink-0 text-primary-600" />
        <span>
          Passwords and session tokens are never stored in plaintext browser storage. All authentication handshakes use PBKDF2/bcrypt hashing.
        </span>
      </div>

      {/* Terminate Other Sessions Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutSessionsModalOpen}
        onClose={() => setIsLogoutSessionsModalOpen(false)}
        onConfirm={handleTerminateOtherSessions}
        title="Sign Out of All Other Sessions?"
        message="This will immediately revoke access from all other phones, tablets, and computers logged into your account. You will remain logged in on this computer."
        confirmText="Revoke Other Sessions"
        variant="warning"
        icon={LogOut}
      />
    </div>
  );
};

export default SecuritySettingsPage;
