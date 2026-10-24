import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, Lock, Check } from 'lucide-react';
import { generateSecurityCodeBlocks } from '../../utils/cryptoUtils';

/**
 * WhatsApp Desktop Style 60-Digit Security Code & QR Verification Modal.
 * Opens when user clicks 'Encryption' in Contact Info Panel.
 */
export const WhatsAppSecurityCodeModal = ({
  isOpen,
  onClose,
  conversationId,
  currentUserId,
  contactUser,
}) => {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const contactId = contactUser?.id || contactUser?._id || 'peer';
    generateSecurityCodeBlocks(conversationId, currentUserId, contactId).then((blocks) => {
      setCodeBlocks(blocks);
    });
  }, [isOpen, conversationId, currentUserId, contactUser]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (codeBlocks.length > 0) {
      navigator.clipboard?.writeText(codeBlocks.join(' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-code-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg z-10 flex flex-col bg-[#111B21] border border-[#222D34] rounded-3xl shadow-2xl overflow-hidden animate-scale-in text-[#E9EDEF]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222D34] bg-[#202C33] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00A884]/20 text-[#00A884] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="security-code-modal-title" className="text-base font-bold text-[#E9EDEF]">
                Verify Security Code
              </h3>
              <p className="text-xs text-[#8696A0]">
                {contactUser?.name || 'Contact'} • 256-bit AES-GCM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-center">
          {/* QR Code Simulation */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg border-4 border-[#00A884]/30 inline-block">
              <div className="w-40 h-40 flex items-center justify-center relative">
                {/* SVG QR Code Pattern */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full fill-slate-900"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Position detection squares (Top-Left, Top-Right, Bottom-Left) */}
                  <rect x="0" y="0" width="28" height="28" rx="4" fill="#0b141a" />
                  <rect x="4" y="4" width="20" height="20" rx="2" fill="#fff" />
                  <rect x="8" y="8" width="12" height="12" rx="1" fill="#00A884" />

                  <rect x="72" y="0" width="28" height="28" rx="4" fill="#0b141a" />
                  <rect x="76" y="4" width="20" height="20" rx="2" fill="#fff" />
                  <rect x="80" y="8" width="12" height="12" rx="1" fill="#00A884" />

                  <rect x="0" y="72" width="28" height="28" rx="4" fill="#0b141a" />
                  <rect x="4" y="76" width="20" height="20" rx="2" fill="#fff" />
                  <rect x="8" y="80" width="12" height="12" rx="1" fill="#00A884" />

                  {/* Simulated Data Pattern Blocks */}
                  <rect x="34" y="4" width="8" height="8" fill="#0b141a" />
                  <rect x="46" y="4" width="8" height="8" fill="#0b141a" />
                  <rect x="58" y="12" width="8" height="8" fill="#0b141a" />
                  <rect x="34" y="20" width="8" height="8" fill="#0b141a" />
                  <rect x="46" y="24" width="8" height="8" fill="#0b141a" />
                  <rect x="12" y="36" width="8" height="8" fill="#0b141a" />
                  <rect x="24" y="40" width="8" height="8" fill="#0b141a" />
                  <rect x="36" y="36" width="8" height="8" fill="#00A884" />
                  <rect x="48" y="44" width="8" height="8" fill="#0b141a" />
                  <rect x="60" y="36" width="8" height="8" fill="#0b141a" />
                  <rect x="72" y="40" width="8" height="8" fill="#0b141a" />
                  <rect x="84" y="36" width="8" height="8" fill="#0b141a" />
                  <rect x="36" y="56" width="8" height="8" fill="#0b141a" />
                  <rect x="48" y="60" width="8" height="8" fill="#00A884" />
                  <rect x="60" y="56" width="8" height="8" fill="#0b141a" />
                  <rect x="72" y="64" width="8" height="8" fill="#0b141a" />
                  <rect x="84" y="68" width="8" height="8" fill="#0b141a" />
                  <rect x="36" y="76" width="8" height="8" fill="#0b141a" />
                  <rect x="48" y="80" width="8" height="8" fill="#0b141a" />
                  <rect x="60" y="76" width="8" height="8" fill="#0b141a" />
                  <rect x="72" y="84" width="8" height="8" fill="#0b141a" />
                </svg>

                {/* Center Lock Badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#111B21] border-2 border-white flex items-center justify-center shadow-md">
                    <Lock className="w-4 h-4 text-[#00A884]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 max-w-sm mx-auto">
            <p className="text-xs text-[#8696A0] leading-relaxed">
              To verify that messages and calls are end-to-end encrypted with{' '}
              <span className="font-semibold text-[#E9EDEF]">{contactUser?.name || 'this contact'}</span>,
              scan this code on their phone or compare the 60-digit number below.
            </p>
          </div>

          {/* 60-Digit Code Display (12 sets of 5 digits) */}
          <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 font-mono text-sm tracking-wider text-[#E9EDEF]">
              {codeBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1.5 rounded-lg bg-[#111B21] border border-[#222D34] text-center font-bold"
                >
                  {block}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="mt-3.5 inline-flex items-center gap-2 text-xs font-semibold text-[#00A884] hover:text-[#06cf9c] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to clipboard</span>
                </>
              ) : (
                <>
                  <span>Copy 60-digit safety numbers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#222D34] bg-[#202C33] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00A884] hover:bg-[#008f6f] text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSecurityCodeModal;
