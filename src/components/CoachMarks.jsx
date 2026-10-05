/**
 * src/components/CoachMarks.jsx
 * First-run interactive onboarding coach marks remembered in localStorage.
 */

import React, { useState, useEffect } from "react";
import { t } from "../core/i18n.js";

export default function CoachMarks({ lang }) {
  const [step, setStep] = useState(() => {
    try {
      const seen = localStorage.getItem("smart_escape_coach_seen");
      return seen ? -1 : 0;
    } catch {
      return -1;
    }
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem("smart_escape_coach_seen", "true");
    } catch {
      // Ignore
    }
    setStep(-1);
  };

  if (step === -1) return null;

  const steps = [
    { title: t(lang, "coachStep1Title"), desc: t(lang, "coachStep1Desc") },
    { title: t(lang, "coachStep2Title"), desc: t(lang, "coachStep2Desc") },
    { title: t(lang, "coachStep3Title"), desc: t(lang, "coachStep3Desc") }
  ];

  const current = steps[step];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "64px",
        right: "400px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        boxShadow: "var(--shadow-popover)",
        maxWidth: "320px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="font-mono micro-label" style={{ color: "var(--route)", fontWeight: 700 }}>
          GUIDE ({step + 1}/3)
        </span>
        <button
          onClick={handleDismiss}
          style={{ width: "20px", height: "20px", padding: 0, border: "none", backgroundColor: "transparent", color: "var(--text-3)" }}
        >
          ×
        </button>
      </div>

      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>
        {current.title}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.4" }}>
        {current.desc}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <button
          onClick={handleDismiss}
          style={{
            height: "24px",
            padding: "0 6px",
            backgroundColor: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: "11px"
          }}
        >
          {t(lang, "dismiss")}
        </button>

        <button
          className="btn-primary"
          style={{ height: "26px", padding: "0 10px", fontSize: "11px" }}
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else handleDismiss();
          }}
        >
          {step < 2 ? "Next →" : t(lang, "dismiss")}
        </button>
      </div>
    </div>
  );
}
