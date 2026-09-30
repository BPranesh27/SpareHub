import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';

export const ImageGallery = ({ images, title }) => {
  const defaultFallback = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800';

  const galleryImages = images && images.length > 0 ? images.map((img) => img.imageUrl) : [defaultFallback];
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Primary Image View */}
      <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
        <img
          src={selectedImage}
          alt={title}
          onError={(e) => {
            e.target.src = defaultFallback;
          }}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        />

        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700 shadow opacity-80 group-hover:opacity-100 transition-all"
          title="Full View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border-2 shrink-0 transition-all ${
                selectedImage === img
                  ? 'border-brand-500 ring-2 ring-brand-500/50 scale-105'
                  : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-12 right-0 bg-slate-800 hover:bg-slate-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              Close ✕
            </button>
            <img
              src={selectedImage}
              alt={title}
              className="max-h-[85vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
