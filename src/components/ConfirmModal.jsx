import React from 'react';

const ConfirmModal = ({ title = 'Confirm', description, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-card/95 dark:bg-dark-card/95 rounded-lg shadow-xl border border-gray-200/30 dark:border-dark-card/40 p-6">
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">{description}</p>
          )}

          <div className="flex justify-center space-x-3">
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-warning dark:bg-dark-warning text-white rounded-md hover:opacity-95 transition"
            >
              {confirmText}
            </button>
            <button
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
