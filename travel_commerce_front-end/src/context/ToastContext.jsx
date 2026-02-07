import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const ToastContext = createContext();

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }) {
  // --- Toast state ---
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience helpers
  const success = useCallback((msg) => showToast(msg, "success"), [showToast]);
  const error = useCallback((msg) => showToast(msg, "error"), [showToast]);
  const warning = useCallback((msg) => showToast(msg, "warning"), [showToast]);
  const info = useCallback((msg) => showToast(msg, "info"), [showToast]);

  // --- Confirm dialog state ---
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback(
    ({
      title = "Are you sure?",
      message = "",
      type = "warning",
      confirmText = "Confirm",
      cancelText = "Cancel",
    } = {}) => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          title,
          message,
          type,
          confirmText,
          cancelText,
          onConfirm: () => {
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      });
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="toast-stack">
        {toasts.map((t, index) => (
          <div key={t.id} style={{ position: "fixed", top: `${20 + index * 72}px`, right: "20px", zIndex: 10000 + index }}>
            <Toast
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState.isOpen && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          type={confirmState.type}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}
    </ToastContext.Provider>
  );
}
