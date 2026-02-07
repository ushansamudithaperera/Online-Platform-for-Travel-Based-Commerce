import React from "react";
import "../styles/ConfirmDialog.css";

export default function ConfirmDialog({
  title = "Are you sure?",
  message = "",
  type = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  const icons = {
    warning: "⚠️",
    danger: "🗑️",
    info: "ℹ️",
  };

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className={`confirm-dialog confirm-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">{icons[type] || icons.warning}</div>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`confirm-ok-btn confirm-ok-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
