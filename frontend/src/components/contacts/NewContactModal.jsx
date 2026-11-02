import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  CheckCircle,
  Share2,
  MessageSquare,
  Copy,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import PhoneInput from '../common/PhoneInput';
import Avatar from '../common/Avatar';
import contactService from '../../services/contactService';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { normalizePhone } from '../../utils/phoneUtils';
import { cn } from '../../utils/cn';

export const NewContactModal = ({
  isOpen,
  onClose,
  onContactCreated,
  onStartChat,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneError, setPhoneError] = useState(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneCheckResult, setPhoneCheckResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdContact, setCreatedContact] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setCountryCode('+91');
      setPhoneError(null);
      setPhoneCheckResult(null);
      setCreatedContact(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Debounced check if phone number is registered
  useEffect(() => {
    if (!phone || phone.trim().length < 5) {
      setPhoneCheckResult(null);
      setPhoneError(null);
      return;
    }

    const timer = setTimeout(async () => {
      const normalized = normalizePhone(phone, countryCode);
      if (!normalized.isValid) {
        setPhoneError(normalized.error);
        setPhoneCheckResult(null);
        return;
      }

      setPhoneError(null);

      // Check if user entered their own number
      if (user?.phone && user.phone === normalized.e164) {
        setPhoneError('You cannot add your own phone number as a contact');
        setPhoneCheckResult(null);
        return;
      }

      setIsCheckingPhone(true);
      try {
        const res = await contactService.checkPhone(phone, countryCode);
        setPhoneCheckResult(res);
      } catch (err) {
        setPhoneCheckResult({ isRegistered: false });
      } finally {
        setIsCheckingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phone, countryCode, user?.phone]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a contact name');
      return;
    }

    const normalized = normalizePhone(phone, countryCode);
    if (!normalized.isValid) {
      setPhoneError(normalized.error);
      return;
    }

    if (user?.phone && user.phone === normalized.e164) {
      setPhoneError('You cannot add your own phone number as a contact');
      return;
    }

    setIsSubmitting(true);
    try {
      const contact = await contactService.addContact({
        name: name.trim(),
        phone: normalized.e164,
        countryCode,
      });

      setCreatedContact(contact);
      onContactCreated?.(contact);
      toast.success(
        contact.isRegistered
          ? `${contact.name} is on uandi! You can message them now.`
          : `Contact ${contact.name} added.`,
        'Contact Saved'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to add contact');
      if (err.message?.includes('already exists')) {
        setPhoneError('A contact with this phone number already exists in your contacts');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteUrl = `${window.location.origin}/register?ref=${encodeURIComponent(user?.phone || 'uandi')}`;
  const inviteText = `Hey! I'm using uandi to chat and call. Download or join here: ${inviteUrl}`;

  const handleShareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on uandi',
          text: inviteText,
          url: inviteUrl,
        });
        toast.success('Invitation shared!');
        return;
      } catch (err) {}
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(inviteText);
      toast.success('Invitation link copied to clipboard!');
    } catch (err) {
      toast.info(`Share this link: ${inviteUrl}`);
    }
  };

  const handleSmsInvite = () => {
    const rawNumber = createdContact?.phone || phone;
    window.location.href = `sms:${rawNumber}?body=${encodeURIComponent(inviteText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100 dark:border-[#2A3942] bg-charcoal-50 dark:bg-[#111B21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-[#00A884]/20 text-primary-600 dark:text-[#00A884] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-[#E9EDEF]">
              {createdContact ? 'Contact Saved' : 'New Contact'}
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

        {/* Post-creation Result View */}
        {createdContact ? (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar
                src={createdContact.contactUser?.avatar}
                name={createdContact.name}
                size="xl"
                className="w-20 h-20 text-xl shadow-lg ring-4 ring-[#00A884]/20"
              />
              {createdContact.isRegistered && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00A884] text-white flex items-center justify-center border-2 border-[#202C33]" title="Registered on uandi">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-bold text-charcoal-900 dark:text-[#E9EDEF]">
                {createdContact.name}
              </h4>
              <p className="text-xs font-mono text-charcoal-500 dark:text-[#8696A0] mt-0.5">
                {createdContact.formattedPhone || createdContact.phone}
              </p>
            </div>

            {createdContact.isRegistered ? (
              <div className="w-full bg-[#00A884]/10 border border-[#00A884]/30 rounded-2xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00A884]">
                  <Sparkles className="w-4 h-4" />
                  <span>This contact is already on uandi!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartChat?.(createdContact.contactUser || createdContact);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message {createdContact.name}</span>
                </button>
              </div>
            ) : (
              <div className="w-full bg-charcoal-50 dark:bg-[#111B21] border border-charcoal-200 dark:border-[#2A3942] rounded-2xl p-4 flex flex-col items-center gap-3">
                <p className="text-xs text-charcoal-600 dark:text-[#8696A0]">
                  This number isn&apos;t registered on uandi yet. Send them an invite to chat and call with end-to-end encryption.
                </p>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleSmsInvite}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 dark:bg-[#00A884]/15 hover:bg-primary-100 dark:hover:bg-[#00A884]/25 text-primary-700 dark:text-[#00A884] text-xs font-semibold transition-colors border border-primary-200/50 dark:border-[#00A884]/30"
                  >
                    <span>Invite via SMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareInvite}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Invite Link</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-charcoal-500 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-[#E9EDEF] pt-2"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-[#8696A0] mb-1.5">
                Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] placeholder-charcoal-400 dark:placeholder-[#8696A0] text-sm focus:outline-none focus:border-[#00A884] transition-colors"
                autoFocus
              />
            </div>

            {/* Country Code Picker & Phone Number */}
            <PhoneInput
              label="Phone Number"
              required
              countryCode={countryCode}
              onCountryChange={(dial) => setCountryCode(dial)}
              value={phone}
              onChange={(val) => setPhone(val)}
              error={phoneError}
            />

            {/* Live Registration Check Feedback Pill */}
            {isCheckingPhone && (
              <p className="text-[11px] text-charcoal-500 dark:text-[#8696A0] animate-pulse">
                Checking if registered on uandi...
              </p>
            )}

            {phoneCheckResult && !isCheckingPhone && (
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs flex items-center justify-between transition-all animate-slide-down',
                  phoneCheckResult.isRegistered
                    ? 'bg-[#00A884]/10 border-[#00A884]/30 text-[#00A884]'
                    : 'bg-charcoal-50 dark:bg-[#111B21] border-charcoal-200 dark:border-[#2A3942] text-charcoal-600 dark:text-[#8696A0]'
                )}
              >
                <div className="flex items-center gap-2">
                  {phoneCheckResult.isRegistered ? (
                    <CheckCircle className="w-4 h-4 text-[#00A884] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-charcoal-400 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {phoneCheckResult.isRegistered
                      ? `Registered user (${phoneCheckResult.user?.name || 'uandi member'})`
                      : 'Not registered yet (invite available)'}
                  </span>
                </div>
                {phoneCheckResult.user?.avatar && (
                  <Avatar src={phoneCheckResult.user.avatar} name={phoneCheckResult.user.name} size="xs" />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100 dark:border-[#2A3942]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-charcoal-600 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-[#E9EDEF] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !phone.trim() || Boolean(phoneError)}
                className="px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewContactModal;

