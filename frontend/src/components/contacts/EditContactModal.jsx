import React, { useState, useEffect } from 'react';
import { X, User, Phone, Check } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';
import contactService from '../../services/contactService';
import useToast from '../../hooks/useToast';
import { normalizePhone } from '../../utils/phoneUtils';

export const EditContactModal = ({
  isOpen,
  onClose,
  contact,
  onContactUpdated,
}) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneError, setPhoneError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact && isOpen) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setCountryCode('+91');
      setPhoneError(null);
      setIsSubmitting(false);
    }
  }, [contact, isOpen]);

  if (!isOpen || !contact) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a contact name');
      return;
    }

    let normalizedPhone = undefined;
    if (phone) {
      const parsed = normalizePhone(phone, countryCode);
      if (!parsed.isValid) {
        setPhoneError(parsed.error);
        return;
      }
      normalizedPhone = parsed.e164;
    }

    setIsSubmitting(true);
    try {
      const updated = await contactService.updateContact(contact.id, {
        name: name.trim(),
        phone: normalizedPhone,
      });

      onContactUpdated?.(updated);
      toast.success(`Contact "${name.trim()}" updated successfully!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#202C33] border border-charcoal-200 dark:border-[#2A3942] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100 dark:border-[#2A3942] bg-charcoal-50 dark:bg-[#111B21]">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-primary-600 dark:text-[#00A884]" />
            <h3 className="text-base font-bold text-charcoal-900 dark:text-[#E9EDEF]">
              Edit Contact
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 dark:border-[#2A3942] bg-white dark:bg-[#111B21] text-charcoal-900 dark:text-[#E9EDEF] text-sm focus:outline-none focus:border-[#00A884]"
              autoFocus
            />
          </div>

          <PhoneInput
            label="Phone Number"
            countryCode={countryCode}
            onCountryChange={(dial) => setCountryCode(dial)}
            value={phone}
            onChange={(val) => setPhone(val)}
            error={phoneError}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100 dark:border-[#2A3942]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-charcoal-600 dark:text-[#8696A0] hover:text-charcoal-900 dark:hover:text-[#E9EDEF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;

