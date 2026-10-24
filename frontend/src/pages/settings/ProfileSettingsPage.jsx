import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Camera,
  MessageSquare,
  Building,
  Smartphone,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { SettingsCard, AvatarPickerModal } from '../../components/settings';
import Avatar from '../../components/common/Avatar';
import OnlineIndicator from '../../components/chat/OnlineIndicator';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { USER_STATUS } from '../../utils/constants';

export const ProfileSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  // Form State
  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [email] = useState(user?.email || 'alex.morgan@pulsechat.io');
  const [statusMessage, setStatusMessage] = useState(
    user?.statusMessage || 'Available on UandMe 🚀'
  );
  const [status, setStatus] = useState(user?.status || USER_STATUS.ONLINE);
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [department, setDepartment] = useState(
    user?.department || 'Computer Science & Software Engineering'
  );
  const [role, setRole] = useState(user?.role || 'Senior Project Lead');

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Validation & Loading
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setStatusMessage(user.statusMessage || '');
      setStatus(user.status || USER_STATUS.ONLINE);
      setPhone(user.phone || '+1 (555) 234-5678');
      setDepartment(user.department || 'Computer Science & Software Engineering');
      setRole(user.role || 'Senior Project Lead');
    }
  }, [user]);

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }
    if (statusMessage.length > 120) {
      newErrors.statusMessage = 'Status message cannot exceed 120 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Save
  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateProfile({
        name: name.trim(),
        avatar,
        statusMessage: statusMessage.trim(),
        status,
        phone: phone.trim(),
        department: department.trim(),
        role: role.trim(),
      });
      setIsSaving(false);
      toast.success('Your profile changes have been saved!', 'Profile Updated');
    }, 400);
  };

  // Handle Cancel (Reset to current user values)
  const handleCancel = () => {
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setStatusMessage(user?.statusMessage || '');
    setStatus(user?.status || USER_STATUS.ONLINE);
    setPhone(user?.phone || '+1 (555) 234-5678');
    setDepartment(user?.department || 'Computer Science & Software Engineering');
    setRole(user?.role || 'Senior Project Lead');
    setErrors({});
    toast.info('Form changes reverted to current profile.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          My Profile
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Manage your personal identity, campus presence, and profile avatar.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Presence Card */}
        <SettingsCard
          title="Profile Avatar & Presence"
          description="Your photo is visible to verified campus contacts and chat groups."
          icon={Camera}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with Change Button Overlay */}
            <div className="relative group shrink-0">
              <Avatar
                src={avatar}
                name={name}
                size="2xl"
                status={status}
                statusPulse={status === 'online'}
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 bg-charcoal-950/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                title="Change Photo"
                aria-label="Change Photo"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Change</span>
              </button>
            </div>

            {/* Profile Overview & Status Pills */}
            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
              <div>
                <h4 className="text-lg font-black text-charcoal-900 dark:text-white truncate">
                  {name}
                </h4>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-mono">
                  {email}
                </p>
              </div>

              {/* Status Picker Buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block mb-1.5">
                  Current Presence Status
                </label>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {Object.values(USER_STATUS).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl capitalize transition-all flex items-center gap-1.5 ${
                        status === st
                          ? 'bg-primary-600 text-white shadow-soft-sm scale-105'
                          : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white'
                      }`}
                    >
                      <OnlineIndicator status={st} size="xs" />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Avatar Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setIsAvatarModalOpen(true)}
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                >
                  Change Profile Photo
                </Button>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Profile Information Form */}
        <SettingsCard
          title="Personal & Academic Information"
          description="Update your display name, about status, and campus department details."
          icon={User}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Input
                label="Full Display Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                leftIcon={<User className="w-4 h-4" />}
                required
                placeholder="e.g. Alex Morgan"
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <Input
                label="Institutional Email (SSO Verified)"
                value={email}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <p className="text-[11px] text-charcoal-400 mt-1">
                University Single Sign-On credentials managed by institution.
              </p>
            </div>

            {/* About / Status Text */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300">
                  About / Status Message
                </label>
                <span className="text-[10px] text-charcoal-400 font-mono">
                  {statusMessage.length}/120
                </span>
              </div>
              <Input
                value={statusMessage}
                onChange={(e) => {
                  setStatusMessage(e.target.value);
                  if (errors.statusMessage)
                    setErrors((prev) => ({ ...prev, statusMessage: null }));
                }}
                leftIcon={<MessageSquare className="w-4 h-4" />}
                placeholder="What are you currently working on?"
                maxLength={120}
              />
              {errors.statusMessage && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.statusMessage}</span>
                </p>
              )}
            </div>

            {/* Academic Department */}
            <div>
              <Input
                label="Academic Department / Faculty"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
                placeholder="e.g. Computer Science"
              />
            </div>

            {/* Role / Title */}
            <div>
              <Input
                label="Academic Role / Title"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="e.g. Senior Project Lead"
              />
            </div>

            {/* Phone Number */}
            <div className="md:col-span-2">
              <Input
                label="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Smartphone className="w-4 h-4" />}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </SettingsCard>

        {/* Action Controls: Save & Cancel */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCancel}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-soft"
          >
            Save Profile
          </Button>
        </div>
      </form>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatar}
        userName={name}
        onSaveAvatar={(newAvatar) => setAvatar(newAvatar)}
      />
    </div>
  );
};

export default ProfileSettingsPage;
