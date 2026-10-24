import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Send,
  Trash2,
  Bell,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SearchInput from '../components/forms/SearchInput';
import useToast from '../hooks/useToast';
import useTheme from '../hooks/useTheme';

export const DesignSystemPage = () => {
  const toast = useToast();
  const { isDark, toggleTheme } = useTheme();

  // Modal demo state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Input states for demo
  const [demoInput, setDemoInput] = useState('');
  const [demoSearch, setDemoSearch] = useState('');
  const [demoError, setDemoError] = useState('Password must contain at least 8 characters');
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const triggerLoadingToggle = () => {
    setIsButtonLoading(true);
    setTimeout(() => {
      setIsButtonLoading(false);
      toast.success('Async action simulated successfully!');
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-10 max-w-6xl mx-auto w-full space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-charcoal-200 dark:border-charcoal-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Component System
          </div>
          <h1 className="text-3xl font-black text-charcoal-900 dark:text-white tracking-tight">
            PulseChat Design System & Component Library
          </h1>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1 max-w-2xl">
            A comprehensive catalog of accessible, reusable UI components crafted with Tailwind CSS, Emerald Green brand tokens, and deep charcoal dark mode.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
          >
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </Button>
        </div>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-600" />
          Color Tokens
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {[
            { label: 'Primary 50', bg: 'bg-primary-50', text: 'text-charcoal-900' },
            { label: 'Primary 100', bg: 'bg-primary-100', text: 'text-charcoal-900' },
            { label: 'Primary 300', bg: 'bg-primary-300', text: 'text-charcoal-900' },
            { label: 'Primary 500', bg: 'bg-primary-500', text: 'text-white' },
            { label: 'Primary 600', bg: 'bg-primary-600', text: 'text-white' },
            { label: 'Primary 900', bg: 'bg-primary-900', text: 'text-white' },
            { label: 'Charcoal 50', bg: 'bg-charcoal-50', text: 'text-charcoal-900' },
            { label: 'Charcoal 200', bg: 'bg-charcoal-200', text: 'text-charcoal-900' },
            { label: 'Charcoal 500', bg: 'bg-charcoal-500', text: 'text-white' },
            { label: 'Charcoal 800', bg: 'bg-charcoal-800', text: 'text-white' },
            { label: 'Charcoal 900', bg: 'bg-charcoal-900', text: 'text-white' },
            { label: 'Charcoal 950', bg: 'bg-charcoal-950', text: 'text-white' },
          ].map((item) => (
            <div
              key={item.label}
              className={`${item.bg} ${item.text} p-4 rounded-2xl border border-charcoal-200/50 dark:border-charcoal-700/50 shadow-soft-sm font-semibold flex flex-col justify-end h-20`}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Buttons Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Buttons & Interactive States
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 space-y-6">
          {/* Variants */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              Variants
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Emerald</Button>
              <Button variant="secondary">Secondary Slate</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Danger Action
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              Sizes
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Size XS</Button>
              <Button size="sm">Size SM</Button>
              <Button size="md">Size MD (Default)</Button>
              <Button size="lg">Size LG</Button>
              <Button size="icon" variant="secondary" aria-label="Notifications">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* States & Icons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              States & Async Feedback
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                isLoading={isButtonLoading}
                onClick={triggerLoadingToggle}
                rightIcon={<Send className="w-4 h-4" />}
              >
                {isButtonLoading ? 'Sending...' : 'Click to Simulate Loading'}
              </Button>
              <Button variant="primary" disabled>
                Disabled State
              </Button>
              <Button variant="secondary" leftIcon={<ExternalLink className="w-4 h-4" />}>
                With Left Icon
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Inputs & Forms Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Form & Input Components
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Standard Text Input"
              placeholder="Enter student username..."
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              helperText="Helper message explaining expected format"
            />

            <Input
              label="Input with Left Icon"
              placeholder="alex@university.edu"
              type="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password with Visibility Toggle"
              type="password"
              placeholder="Enter secret passphrase"
              leftIcon={<Lock className="w-4 h-4" />}
              defaultValue="uandme2026"
            />

            <Input
              label="Validation Error State"
              type="text"
              defaultValue="short"
              error={demoError}
              onChange={(e) => setDemoError(e.target.value.length < 8 ? 'Password must be at least 8 chars' : '')}
            />
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">
              Search Component
            </h4>
            <SearchInput
              value={demoSearch}
              onChange={(e) => setDemoSearch(e.target.value)}
              onClear={() => setDemoSearch('')}
              placeholder="Search conversations, messages, or shared resources..."
            />
          </div>
        </div>
      </section>

      {/* 4. Avatars Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Avatars & Presence Indicators
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              Sizes (xs, sm, md, lg, xl, 2xl)
            </h4>
            <div className="flex items-center gap-4 flex-wrap">
              <Avatar size="xs" name="Alex Morgan" />
              <Avatar size="sm" name="Sarah Connor" />
              <Avatar size="md" name="David Chen" />
              <Avatar size="lg" name="Elena Rostova" />
              <Avatar size="xl" name="Marcus Vance" />
              <Avatar
                size="2xl"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                name="Alex"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              Presence Statuses (Online with Pulse, Away, Busy, Offline)
            </h4>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar name="Online User" status="online" statusPulse />
                <span className="text-xs font-medium">Online (Live Pulse)</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar name="Away User" status="away" />
                <span className="text-xs font-medium">Away</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar name="Busy User" status="busy" />
                <span className="text-xs font-medium">Busy / Do Not Disturb</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar name="Offline User" status="offline" />
                <span className="text-xs font-medium">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Toasts Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Toast Notification System
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-4">
            Click any button below to trigger dynamic floating toasts with auto-dismiss timers and clear visual cues.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => toast.success('Message delivered to socket gateway.', 'Success')}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            >
              Trigger Success Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.error('WebSocket connection dropped. Reconnecting...', 'Connection Error')}
              leftIcon={<AlertCircle className="w-4 h-4 text-rose-500" />}
            >
              Trigger Error Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.warning('Low storage space available on client.', 'Warning')}
              leftIcon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            >
              Trigger Warning Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.info('New team member joined the room.', 'Information')}
              leftIcon={<Info className="w-4 h-4 text-sky-500" />}
            >
              Trigger Info Toast
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Interactive Modal Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Accessible Modal Dialog
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-white">
              Interactive Dialog Preview
            </h4>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Features focus trap, Escape key handling, backdrop click dismiss, and scale animation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Open Standard Modal
            </Button>
            <Button variant="danger" onClick={() => setIsConfirmModalOpen(true)}>
              Open Confirmation Dialog
            </Button>
          </div>
        </div>

        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={() => {
            setIsConfirmModalOpen(false);
            toast.error('Destructive action confirmed!');
          }}
          title="Delete Conversation?"
          message="This action will remove the conversation and all attached message history. This cannot be undone."
          confirmText="Delete Conversation"
          variant="danger"
          note="Accessible alertdialog with keyboard focus trapping and escape dismiss."
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Demo Dialog Modal"
          description="A demonstration of the reusable Modal component in PulseChat."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  toast.success('Confirmed from modal dialog!');
                }}
              >
                Confirm Action
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">
              This modal is configured with backdrop blur, keyboard navigation (try pressing <kbd className="px-1.5 py-0.5 rounded bg-charcoal-100 dark:bg-charcoal-800 border text-xs font-mono">Esc</kbd>), and flexible header, body, and footer slots.
            </p>
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-xs text-primary-800 dark:text-primary-200 border border-primary-200/50">
              💡 Tip: All dialogs inherit system theme settings smoothly.
            </div>
          </div>
        </Modal>
      </section>

      {/* 7. Loading Spinners Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Loading Spinners
        </h2>

        <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" color="emerald" />
              <span className="text-xs font-medium">Small</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="md" color="emerald" />
              <span className="text-xs font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="lg" color="emerald" />
              <span className="text-xs font-medium">Large</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="xl" color="emerald" />
              <span className="text-xs font-medium">Extra Large</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Empty & Error States */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
          Empty State & Error State Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
            <EmptyState
              title="No Messages Yet"
              description="Start a new direct chat thread with your peers or create a study group."
              actionLabel="Start Conversation"
              onAction={() => toast.info('Starting new conversation...')}
            />
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
            <ErrorState
              title="Failed to Load Stream"
              message="Could not reach the server endpoint. Verify network status and retry."
              onRetry={() => toast.info('Retrying connection...')}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemPage;
