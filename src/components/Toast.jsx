/**
 * src/components/Toast.jsx
 * Floating snackbar toast with 4s auto-dismiss and Undo action.
 */

import React, { useEffect } from "react";
import { t } from "../core/i18n.js";

export default function Toast({ toast, lang, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast?.id, onDismiss]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "56px",
        left: "24px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--radius-md)",
        padding: "8px 14px",
        boxShadow: "var(--shadow-popover)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 100,
        fontSize: "12px",
        color: "var(--text)",
        animation: "toastSlide 200ms cubic-bezier(0.2, 0, 0, 1)"
      }}
    >
      <span>{t(lang, toast.messageKey, toast.params || {})}</span>

      {toast.showUndo && (
        <button
          onClick={() => {
            onUndo();
            onDismiss();
          }}
          style={{
            height: "24px",
            padding: "0 8px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--route)",
            border: "1px solid var(--route)",
            backgroundColor: "transparent"
          }}
        >
          {t(lang, "undo")}
        </button>
      )}

      <button
        onClick={onDismiss}
        style={{
          width: "20px",
          height: "20px",
          padding: 0,
          border: "none",
          backgroundColor: "transparent",
          color: "var(--text-3)",
          fontSize: "14px"
        }}
      >
        ×
      </button>
    </div>
  );
}
