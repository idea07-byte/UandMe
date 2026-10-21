import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  HardDrive,
  Download,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { SettingsCard } from '../../components/settings';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';

export const AccountSettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(
        'Your PulseChat data archive has been generated and queued for download!',
        'Data Export Ready'
      );
    }, 1500);
  };

  const handleConfirmLogout = () => {
    logout();
    toast.info('You have securely signed out of your account.');
    navigate('/login');
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    toast.warning(
      'Account deletion request received (Frontend Demo). Production API will execute hard delete on backend database.',
      'Account Deletion'
    );
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Account Settings
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Review your account identity, storage quotas, data archives, and session controls.
        </p>
      </div>

      {/* Account Overview & Quotas */}
      <SettingsCard
        title="Account Information & Identity"
        description="Verified student account credentials linked to University Identity Provider."
        icon={Shield}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
              Account Identifier
            </span>
            <p className="font-mono font-bold text-charcoal-900 dark:text-white">
              {user?.id || 'usr_me_1'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
              Verification Status
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Campus SSO Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
              Student Handle
            </span>
            <p className="font-mono text-primary-600 dark:text-primary-400 font-bold">
              {user?.handle || '@alexmorgan'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-100 dark:border-charcoal-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
              Member Since
            </span>
            <div className="flex items-center gap-1.5 text-charcoal-700 dark:text-charcoal-300 font-medium">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Fall 2024 Semester</span>
            </div>
          </div>
        </div>

        {/* Media Storage Quota Bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-charcoal-900 dark:text-white">Cloud Storage Quota</span>
            </div>
            <span className="text-charcoal-500 font-mono">142 MB / 5.0 GB (2.8%)</span>
          </div>

          <div className="w-full h-2 rounded-full bg-charcoal-100 dark:bg-charcoal-800 overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full w-[2.8%]" />
          </div>
          <p className="text-[11px] text-charcoal-400">
            Storage allocated for project documents, PDFs, attachments, and profile media.
          </p>
        </div>
      </SettingsCard>

      {/* Account Management & Data Export */}
      <SettingsCard
        title="Data Export & Portability"
        description="Request a machine-readable JSON archive of your conversations, media, and contact list."
        icon={Download}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800">
          <div>
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-white">
              Export Chat Archives & Metadata
            </h4>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Includes conversation threads, encryption timestamps, and uploaded artifacts.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Request Export
          </Button>
        </div>
      </SettingsCard>

      {/* Session Management */}
      <SettingsCard
        title="Session Actions"
        description="Sign out from your active workspace session on this browser."
        icon={LogOut}
      >
        <div className="flex items-center justify-between p-4 rounded-2xl bg-charcoal-50/70 dark:bg-charcoal-800/40 border border-charcoal-100 dark:border-charcoal-800">
          <div>
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-white">
              Sign Out from PulseChat
            </h4>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Securely purge local tokens and return to the login screen.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsLogoutModalOpen(true)}
            leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
          >
            Sign Out
          </Button>
        </div>
      </SettingsCard>

      {/* Danger Zone: Delete Account */}
      <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-soft-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Danger Zone: Delete Account
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1 leading-relaxed">
              Permanently delete your student account, message histories, personal files, and preferences.
              Once confirmed, this operation cannot be reversed.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete PulseChat Account
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of PulseChat?"
        message="Are you sure you want to log out? You will need to enter your university credentials or demo sandbox access to sign in again."
        confirmText="Sign Out"
        variant="primary"
        icon={LogOut}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Your Account?"
        message="This action will permanently delete your profile, message threads, shared documents, and peer associations. All data will be removed according to university privacy retention policies."
        confirmText="Yes, Delete My Account"
        variant="danger"
        icon={AlertTriangle}
        note="Frontend demonstration: In production, this dispatches a secure DELETE /api/users/me request to MongoDB."
      />
    </div>
  );
};

export default AccountSettingsPage;
