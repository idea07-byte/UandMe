import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Palette,
  Check,
  Type,
  Layout,
  Sparkles,
} from 'lucide-react';
import { SettingsCard, SettingsRadioGroup } from '../../components/settings';
import useTheme from '../../hooks/useTheme';
import useToast from '../../hooks/useToast';
import { THEME_MODES } from '../../utils/constants';
import { cn } from '../../utils/cn';

export const AppearanceSettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  // Local non-sensitive UI preferences (persisted in localStorage)
  const [bubbleDensity, setBubbleDensity] = useState(() => {
    return localStorage.getItem('pulsechat_bubble_density') || 'comfortable';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('pulsechat_font_size') || 'normal';
  });

  const handleDensityChange = (density) => {
    setBubbleDensity(density);
    localStorage.setItem('pulsechat_bubble_density', density);
    toast.success(`Message density set to ${density}.`);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('pulsechat_font_size', size);
    toast.success(`Font scaling set to ${size}.`);
  };

  const themeOptions = [
    {
      id: THEME_MODES.LIGHT,
      name: 'Light Theme',
      description: 'Clean emerald green accents with crisp white background surfaces.',
      icon: Sun,
      previewBg: 'bg-white border-charcoal-200',
      previewCard: 'bg-charcoal-50 text-charcoal-900 border-charcoal-200',
    },
    {
      id: THEME_MODES.DARK,
      name: 'Dark Mode',
      description: 'Eye-friendly deep charcoal surfaces with luminous emerald highlights.',
      icon: Moon,
      previewBg: 'bg-charcoal-950 border-charcoal-800',
      previewCard: 'bg-charcoal-900 text-charcoal-100 border-charcoal-800',
    },
    {
      id: THEME_MODES.SYSTEM,
      name: 'System Sync',
      description: 'Automatically switches between light and dark to mirror your operating system.',
      icon: Laptop,
      previewBg: 'bg-gradient-to-r from-white to-charcoal-950 border-charcoal-300',
      previewCard: 'bg-charcoal-100 dark:bg-charcoal-900 text-charcoal-900 dark:text-white',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-charcoal-900 dark:text-white tracking-tight">
          Appearance & Theme
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Customize the visual theme, contrast, message density, and typography across all PulseChat views.
        </p>
      </div>

      {/* Theme Selection Cards */}
      <SettingsCard
        title="Color Theme Mode"
        description="Select your preferred theme. Themes apply instantly across all chat, profile, and settings screens."
        icon={Palette}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  toast.success(`Theme switched to ${opt.name}`);
                }}
                className={cn(
                  'flex flex-col text-left p-4 rounded-3xl border-2 transition-all relative overflow-hidden group select-none',
                  isSelected
                    ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30 shadow-soft'
                    : 'border-charcoal-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 hover:border-charcoal-300 dark:hover:border-charcoal-700'
                )}
              >
                {/* Visual Preview Swatch */}
                <div
                  className={cn(
                    'w-full h-20 rounded-2xl border mb-3 p-2 flex flex-col justify-between overflow-hidden shadow-soft-sm',
                    opt.previewBg
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className={cn('p-1.5 rounded-lg border text-[9px] font-mono', opt.previewCard)}>
                    <span>Message preview...</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-charcoal-400'
                      )}
                    />
                    <h4
                      className={cn(
                        'text-sm font-bold',
                        isSelected ? 'text-primary-950 dark:text-primary-100' : 'text-charcoal-900 dark:text-white'
                      )}
                    >
                      {opt.name}
                    </h4>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-soft-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Message Density Preferences */}
      <SettingsCard
        title="Message Bubble Layout Density"
        description="Control padding and spacing between message bubbles in the active conversation stream."
        icon={Layout}
      >
        <SettingsRadioGroup
          name="bubbleDensity"
          value={bubbleDensity}
          onChange={handleDensityChange}
          options={[
            {
              value: 'compact',
              label: 'Compact Mode',
              description: 'Tighter bubble padding, ideal for viewing high volumes of messages quickly.',
            },
            {
              value: 'comfortable',
              label: 'Comfortable (Default)',
              description: 'Balanced line spacing and modern bubble padding modeled on WhatsApp Web.',
            },
            {
              value: 'spacious',
              label: 'Spacious Mode',
              description: 'Generous whitespace and larger message bubbles for relaxed readability.',
            },
          ]}
        />
      </SettingsCard>

      {/* Typography Preferences */}
      <SettingsCard
        title="Chat Typography & Scaling"
        description="Select the default font scaling applied to text inputs and messages."
        icon={Type}
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'small', label: 'Small (13px)', sizeDesc: 'Compact text' },
            { id: 'normal', label: 'Medium (14px)', sizeDesc: 'Standard baseline' },
            { id: 'large', label: 'Large (16px)', sizeDesc: 'Enhanced visibility' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleFontSizeChange(item.id)}
              className={cn(
                'p-3.5 rounded-2xl border text-left transition-all',
                fontSize === item.id
                  ? 'border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 text-primary-950 dark:text-primary-100 shadow-soft-sm'
                  : 'border-charcoal-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 hover:border-charcoal-300'
              )}
            >
              <span className="text-xs font-bold block">{item.label}</span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">{item.sizeDesc}</span>
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Persistence Note */}
      <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-900/60 flex items-center gap-3 text-xs text-primary-800 dark:text-primary-300">
        <Sparkles className="w-4 h-4 shrink-0 text-primary-600" />
        <span>
          Appearance preferences are stored locally in your browser's safe storage and automatically apply on every visit.
        </span>
      </div>
    </div>
  );
};

export default AppearanceSettingsPage;
