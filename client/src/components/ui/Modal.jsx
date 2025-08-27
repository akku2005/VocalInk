import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-[var(--border-color)] shadow-lg" style={{ backgroundColor: 'rgb(var(--color-background))' }} role="dialog" aria-modal="true">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="p-5 text-text-primary">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal; 