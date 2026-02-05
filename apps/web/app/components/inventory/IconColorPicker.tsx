"use client";

import { InventoryIcons, AccountIcons, Icons } from '../../lib/icons';
import { getIconStyle } from '../../utils/helpers';

const COLORS = [
  { name: 'Gray', class: 'text-muted', bg: 'bg-slate-500' },
  { name: 'Indigo', class: 'text-primary', bg: 'bg-primary' },
  { name: 'Red', class: 'text-error', bg: 'bg-error' },
  { name: 'Green', class: 'text-success', bg: 'bg-success' },
  { name: 'Gold', class: 'text-warning', bg: 'bg-warning' },
  { name: 'Blue', class: 'text-blue-500', bg: 'bg-accent-primary' },
  { name: 'Pink', class: 'text-pink-500', bg: 'bg-pink-500' },
  { name: 'Purple', class: 'text-purple-500', bg: 'bg-purple-500' },
  { name: 'Orange', class: 'text-orange-500', bg: 'bg-orange-500' },
  { name: 'Yellow', class: 'text-yellow-500', bg: 'bg-yellow-500' },
];

const EMOJIS = ['🪑', '⚪', '🍴', '🍷', '🌸', '🎪', '💃', '📽️', '🔊', '✨', '🍸', '🟥', '🥘', '⚡', '🛋️', '📦', '🎈', '🎁', '🕯️', '👔'];

interface IconColorPickerProps {
  currentIcon: string;
  currentColor: string;
  type?: 'inventory' | 'account';
  onChange: (data: { image: string, color: string }) => void;
  onClose: () => void;
}

export const IconColorPicker = ({ currentIcon, currentColor, type = 'inventory', onChange, onClose }: IconColorPickerProps) => {
  const { X } = Icons;

  const IconsToShow = type === 'account' ? AccountIcons : InventoryIcons;
  const activeStyle = getIconStyle(currentColor);

  const handleIconSelect = (iconKey: string) => {
    onChange({ image: `icon:${iconKey}`, color: currentColor });
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange({ image: emoji, color: currentColor });
  };

  const handleColorSelect = (colorClass: string) => {
    onChange({ image: currentIcon, color: colorClass });
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-3xl shadow-2xl z-50 w-80 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-border flex justify-between items-center bg-background/50">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Customize Icon</span>
        <button onClick={onClose} className="p-1.5 hover:bg-background rounded-full transition-colors">
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* COLOR SELECTOR */}
        <div>
          <label className="text-theme-body font-semibold text-muted uppercase mb-3 block tracking-widest">Color Palette</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color.class)}
                className={`w-7 h-7 rounded-full ${color.bg} transition-all hover:scale-110 active:scale-90 shadow-sm ${currentColor === color.class ? 'ring-2 ring-offset-2 ring-offset-background ring-secondary scale-110' : ''}`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* ICON GRID */}
        <div>
          <label className="text-theme-body font-semibold text-muted uppercase mb-3 block tracking-widest">
            {type === 'account' ? 'Account Icons' : 'Available Icons'}
          </label>
          <div className="grid grid-cols-5 gap-3">
            {Object.keys(IconsToShow).map((key) => {
              const IconComp = IconsToShow[key];
              if (!IconComp) return null;
              const isSelected = currentIcon === `icon:${key}`;
              return (
                <button
                  key={key}
                  onClick={() => handleIconSelect(key)}
                  className={`aspect-square flex items-center justify-center rounded-xl transition-all ${
                    isSelected 
                      ? `${activeStyle.container} ring-2 ring-current shadow-lg scale-105` 
                      : 'bg-background hover:bg-background/80 text-muted hover:text-foreground'
                  }`}
                >
                  <IconComp className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </div>

        {/* EMOJI GRID */}
        <div>
          <label className="text-theme-body font-semibold text-muted uppercase mb-3 block tracking-widest">Emojis</label>
          <div className="grid grid-cols-5 gap-3">
            {EMOJIS.map((emoji) => {
              const isSelected = currentIcon === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-xl transition-all ${
                    isSelected 
                      ? `${activeStyle.container} ring-2 ring-current shadow-lg scale-105` 
                      : 'bg-background hover:bg-background/80'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};