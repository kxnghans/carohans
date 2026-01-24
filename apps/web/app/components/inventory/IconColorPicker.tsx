"use client";

import React from 'react';
import { InventoryIcons, Icons } from '../../lib/icons';

const COLORS = [
  { name: 'Gray', class: 'text-slate-500', bg: 'bg-slate-500' },
  { name: 'Indigo', class: 'text-indigo-600', bg: 'bg-indigo-600' },
  { name: 'Red', class: 'text-rose-600', bg: 'bg-rose-600' },
  { name: 'Green', class: 'text-emerald-600', bg: 'bg-emerald-600' },
  { name: 'Gold', class: 'text-amber-500', bg: 'bg-amber-500' },
  { name: 'Blue', class: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Pink', class: 'text-pink-500', bg: 'bg-pink-500' },
  { name: 'Purple', class: 'text-purple-500', bg: 'bg-purple-500' },
  { name: 'Orange', class: 'text-orange-500', bg: 'bg-orange-500' },
  { name: 'Yellow', class: 'text-yellow-500', bg: 'bg-yellow-500' },
];

const EMOJIS = ['🪑', '⚪', '🍴', '🍷', '🌸', '🎪', '💃', '📽️', '🔊', '✨', '🍸', '🟥', '🥘', '⚡', '🛋️', '📦', '🎈', '🎁', '🕯️', '👔'];

interface IconColorPickerProps {
  currentIcon: string;
  currentColor: string;
  onChange: (data: { image: string, color: string }) => void;
  onClose: () => void;
}

export const IconColorPicker = ({ currentIcon, currentColor, onChange, onClose }: IconColorPickerProps) => {
  const { X } = Icons;

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
    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 w-72 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customize Icon</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* COLOR SELECTOR */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color.class)}
                className={`w-6 h-6 rounded-full ${color.bg} transition-transform hover:scale-110 active:scale-90 ${currentColor === color.class ? 'ring-2 ring-offset-2 ring-slate-300 scale-110' : ''}`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* ICON GRID */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Icons</label>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {Object.keys(InventoryIcons).map((key) => {
              const IconComp = InventoryIcons[key];
              const isSelected = currentIcon === `icon:${key}`;
              return (
                <button
                  key={key}
                  onClick={() => handleIconSelect(key)}
                  className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <IconComp className={`w-5 h-5 ${isSelected ? currentColor : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* EMOJI GRID */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Emojis</label>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {EMOJIS.map((emoji) => {
              const isSelected = currentIcon === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`aspect-square flex items-center justify-center rounded-lg border text-xl transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
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
