import React from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'default' 
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop Click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white border-2 border-charcoal shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter leading-tight">
              {title}
            </h2>
            <div className="h-1 w-12 bg-charcoal mt-2" />
          </div>
          <button 
            onClick={onClose}
            className="text-charcoal cursor-pointer hover:bg-charcoal hover:text-white transition-colors p-1 border-2 border-transparent hover:border-charcoal flex items-center justify-center"
          >
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-charcoal/60 uppercase tracking-widest leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border-2 border-charcoal text-[10px] font-black cursor-pointer uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-4 border-2 border-charcoal text-[10px] font-black cursor-pointer uppercase tracking-[0.2em] text-white transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              isDanger ? 'bg-red-500' : 'bg-charcoal'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
