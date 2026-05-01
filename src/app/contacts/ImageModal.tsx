'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ImageModalProps {
  src: string;
  alt: string;
}

export function ImageModal({ src, alt }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <div 
        className="relative w-full h-full cursor-pointer group overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 bg-white/80 backdrop-blur-sm text-gray-900 text-xs font-medium px-2 py-1 rounded shadow-sm transition-opacity">
            Click to expand
          </span>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>
        </div>
      )}
    </>
  );
}
