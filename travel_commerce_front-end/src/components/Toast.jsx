import React, { useEffect } from "react";
import "../styles/Toast.css"; // <-- make sure this path is correct

export default function Toast({ message, type = "success", onClose }) {
  
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-base toast-type-${type} toast-animation`}>
      <p className="toast-message">{message}</p>

      <button
        onClick={onClose}
        className="toast-close-button"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}
