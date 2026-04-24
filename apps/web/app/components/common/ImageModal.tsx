"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getImageUrl } from '../../utils/helpers';

interface ImageModalProps {
    isOpen: boolean;
    imagePath: string | undefined | null;
    title: string;
    onClose: () => void;
}

export const ImageModal = ({
    isOpen,
    imagePath,
    title,
    onClose
}: ImageModalProps) => {
    const [mounted, setMounted] = useState(false);
    
    useScrollLock(isOpen);

    useEffect(() => {
        setMounted(true);
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const { X } = Icons;
    const imageUrl = getImageUrl(imagePath);

    return createPortal(
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-10"
            onClick={onClose}
        >
            <button 
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-[70]"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </button>
            
            <div 
                className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={title} 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        />
                    ) : (
                        <div className="w-64 h-64 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 text-white/40">
                            <Icons.ImageOff className="w-20 h-20" />
                        </div>
                    )}
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-white text-2xl font-bold tracking-tight">{title}</h3>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-widest">Inventory Preview</p>
                </div>
            </div>
        </div>,
        document.body
    );
};