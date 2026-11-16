import React, { useEffect } from 'react';

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div className={`toast ${toast.type || 'info'}`}>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={onRemove} title="Dismiss">
        ✕
      </button>
    </div>
  );
};

export default Toast;
