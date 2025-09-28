import React, { useRef, useEffect } from 'react';

const ConfirmModal = ({ title = 'Confirm', description, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) => {
  const modalRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    // Focus confirm button when modal opens
    const timer = setTimeout(() => {
      confirmRef.current?.focus();
    }, 0);

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }

      if (e.key === 'Tab') {
        // Basic focus trap: cycle between confirm and cancel
        const focusable = [confirmRef.current, cancelRef.current].filter(Boolean);
        if (focusable.length === 0) return;
        const currentIndex = focusable.indexOf(document.activeElement);
        if (e.shiftKey) {
          // Shift+Tab
          const prev = focusable[(currentIndex - 1 + focusable.length) % focusable.length];
          e.preventDefault();
          prev.focus();
        } else {
          const next = focusable[(currentIndex + 1) % focusable.length];
          e.preventDefault();
          next.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
      // restore focus
      previouslyFocused.current?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" ref={modalRef}>
        <div className="bg-card/95 dark:bg-dark-card/95 rounded-lg shadow-xl border border-gray-200/30 dark:border-dark-card/40 p-6">
          <h3 id="confirm-modal-title" className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">{description}</p>
          )}

          <div className="flex justify-center space-x-3">
            <button
              ref={confirmRef}
              onClick={onConfirm}
              className="px-4 py-2 bg-warning dark:bg-dark-warning text-white rounded-md hover:opacity-95 transition"
            >
              {confirmText}
            </button>
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="px-4 py-2 bg-card/80 dark:bg-dark-card/80 text-text-primary dark:text-dark-text-primary rounded-md border border-transparent hover:border-gray-200/30 transition"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
