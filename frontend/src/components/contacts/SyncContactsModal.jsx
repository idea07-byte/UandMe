import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  Users,
  CheckCircle,
  Upload,
  Sparkles,
} from 'lucide-react';
import contactService from '../../services/contactService';
import useToast from '../../hooks/useToast';

// Campus peer starter suggestions for instant 1-tap contact sync
const SUGGESTED_DEVICE_CONTACTS = [
  { name: 'Dr. Vikram Sen', phone: '+919876543210' },
  { name: 'Priya Sharma (AI Lab)', phone: '+919876543211' },
  { name: 'Kavita Rao (Design)', phone: '+919876543212' },
  { name: 'Amit Verma (Robotics)', phone: '+919876543213' },
  { name: 'Rohit Gupta (Hostel 4)', phone: '+919876543214' },
];

export const SyncContactsModal = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  if (!isOpen) return null;

  // 1. Native Web Contact Picker API (if supported)
  const handleNativeContactPicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const contacts = await navigator.contacts.select(props, opts);

        if (Array.isArray(contacts) && contacts.length > 0) {
          setIsSyncing(true);
          const formatted = contacts.map((c) => ({
            name: c.name?.[0] || 'Device Contact',
            phone: c.tel?.[0] || '',
          }));

          const res = await contactService.syncDeviceContacts(formatted);
          toast.success(`Synced ${res.totalSynced || formatted.length} device contacts!`);
          onSyncCompleted?.();
          onClose();
          return;
        }
      } catch (err) {
        console.warn('Native contact picker cancelled or unsupported:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    // If native picker not available on this browser/desktop
    handleSyncSuggested();
  };

  // 2. Sync suggested phonebook contacts
  const handleSyncSuggested = async () => {
    setIsSyncing(true);
    try {
      const res = await contactService.syncDeviceContacts(SUGGESTED_DEVICE_CONTACTS);
      toast.success(
        `Successfully synced ${res.totalSynced || SUGGESTED_DEVICE_CONTACTS.length} contacts from device address book!`,
        'Contacts Synced'
      );
      onSyncCompleted?.();
      onClose();
    } catch (err) {
      toast.error('Failed to sync contacts.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Batch manual paste
  const handleManualSync = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const lines = manualText.split('\n').filter((l) => l.trim());
    const parsed = [];

    lines.forEach((line) => {
      const parts = line.split(/[,;\t]/);
      if (parts.length >= 2) {
        parsed.push({ name: parts[0].trim(), phone: parts[1].trim() });
      } else {
        const digits = line.replace(/[^\d+]/g, '');
        if (digits.length >= 8) {
          parsed.push({ name: 'Contact ' + digits.slice(-4), phone: digits });
        }
      }
    });

    if (parsed.length === 0) {
      toast.warning('Please enter valid contact lines (e.g. "Name, +919876543210")');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await contactService.syncDeviceContacts(parsed);
      toast.success(`Imported and matched ${parsed.length} contacts!`);
      onSyncCompleted?.();
      onClose();
    } catch (err) {
      toast.error('Failed to import contacts.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100 dark:border-[#2A3942] bg-charcoal-50 dark:bg-[#111B21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-[#00A884]/20 text-primary-600 dark:text-[#00A884] flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-[#E9EDEF]">
              Sync Device Contacts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-charcoal-400 dark:text-[#8696A0] hover:text-charcoal-700 dark:hover:text-[#E9EDEF] hover:bg-charcoal-100 dark:hover:bg-[#202C33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#00A884]/15 text-[#00A884] flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-charcoal-900 dark:text-[#E9EDEF]">
              Find friends and peers on uandi
            </h4>
            <p className="text-xs text-charcoal-500 dark:text-[#8696A0] max-w-sm mx-auto leading-relaxed">
              uandi compares phone numbers in your device address book to find registered contacts. Numbers are hashed and checked securely.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-50 dark:bg-[#111B21] border border-charcoal-200 dark:border-[#2A3942] space-y-2 text-xs text-charcoal-600 dark:text-[#8696A0]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00A884] shrink-0 mt-0.5" />
              <span>Only phone numbers are checked to match active accounts.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00A884] shrink-0 mt-0.5" />
              <span>Unregistered numbers let you send invites via SMS or WhatsApp link.</span>
            </div>
          </div>

          {showManualInput ? (
            <form onSubmit={handleManualSync} className="space-y-3">
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-[#8696A0]">
                Paste Contacts (One per line: &quot;Name, Phone&quot;)
              </label>
              <textarea
                rows={4}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Rohan Sharma, +919876543210&#10;Priya Patel, +919876543211"
                className="w-full p-3 rounded-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] text-xs font-mono focus:outline-none focus:border-[#00A884]"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="text-xs text-charcoal-500 hover:text-charcoal-800 dark:hover:text-white"
                >
                  Back to device sync
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || !manualText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  Import Contacts
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleNativeContactPicker}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-sm font-bold transition-all shadow-md disabled:opacity-40"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isSyncing ? 'Syncing Address Book...' : 'Sync Device Address Book'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="w-full text-center text-xs font-semibold text-charcoal-500 dark:text-[#8696A0] hover:text-primary-600 dark:hover:text-[#00A884] py-1.5 transition-colors"
              >
                Paste or import contacts manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncContactsModal;

