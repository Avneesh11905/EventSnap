import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string | null;
    onClose: () => void;
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (imageUrl) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [imageUrl, onClose]);

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button 
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors z-[210] shadow-lg backdrop-blur-md border border-white/10"
                onClick={onClose}
            >
                <X size={24} />
            </button>
            <div 
                className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <img 
                    src={imageUrl} 
                    alt="Lightbox fullscreen" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    draggable={false}
                />
            </div>
        </div>
    );
}
