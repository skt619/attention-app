import React from "react";
import mathSteps from "../data/mathSteps.js";

const cardStyle = {
  background: "rgba(15,23,42,0.95)",
  border: "1px solid #334155",
  borderRadius: 20,
  padding: 18,
};

function StepItem({ title, index, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: active ? "1px solid #22d3ee" : "1px solid #334155",
        background: active ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
        color: "#e5eefc",
        cursor: "pointer",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        Step {index + 1}
      </div>
      <div style={{ fontWeight: 600 }}>{title}</div>
    </button>
  );
}

export default function Sidebar({
  open,
  onToggle,
  section,
  onSectionChange,
  controls,
  onControlsChange,
  beginnerMode,
  onBeginnerToggle,
  activeStep,
  onStepChange,
}) {
  return (
    <div
      style={{
        width: open ? 340 : 84,
        transition: "width 0.25s ease",
        borderRight: "1px solid #334155",
        background: "rgba(2,6,23,0.96)",
        padding: 16,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: open ? "space-between" : "center",
          alignItems: "center",
          marginBottom: 16,
          gap: 8,
        }}
      >
        {open && <div style={{ fontWeight: 700, fontSize: 18 }}>Controls</div>}
        <button
          type="button"
          onClick={onToggle}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #334155",
            background: "rgba(15,23,42,0.8)",
            color: "#e5eefc",
            cursor: "pointer",
            fontWeight: 700,
            width: open ? "auto" : "100%",
          }}
        >
          {open ? "←" : "→"}
        </button>
      </div>

      {open ? (
        <>
          <div style={cardStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <button
                type="button"
                onClick={() => onSectionChange("controls")}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: section === "controls" ? "1px solid #22d3ee" : "1px solid #334155",
                  background: section === "controls" ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
                  color: "#e5eefc",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ⚙️ Controls
              </button>
              <button
                type="button"
                onClick={() => onSectionChange("math")}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: section === "math" ? "1px solid #22d3ee" : "1px solid #334155",
                  background: section === "math" ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
                  color: "#e5eefc",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📘 Math Steps
              </button>
            </div>
          </div>

          {section === "controls" && (
            <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
              <div style={cardStyle}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Input tokens
                </label>
                <input
                  value={controls.tokenText}
                  onChange={(e) => onControlsChange({ tokenText: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#e5eefc",
                    padding: "10px 12px",
                    fontSize: 14,
                  }}
                />
                <div style={{ color: "#94a3b8", marginTop: 8 }}>
                  Separate tokens with commas.
                </div>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Temperature
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="5"
                  step="0.01"
                  value={controls.temperature}
                  onChange={(e) => onControlsChange({ temperature: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ color: "#cbd5e1" }}>0.25</span>
                  <span style={{ color: "#67e8f9" }}>{controls.temperature.toFixed(2)}</span>
                  <span style={{ color: "#cbd5e1" }}>5</span>
                </div>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  d_model
                </label>
                <select
                  value={controls.dModel}
                  onChange={(e) => onControlsChange({ dModel: Number(e.target.value) })}
                  style={{ width: "100%", borderRadius: 14, border: "1px solid #334155", background: "#020617", color: "#e5eefc", padding: "10px 12px" }}
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                </select>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Heads
                </label>
                <select
                  value={controls.numHeads}
                  onChange={(e) => onControlsChange({ numHeads: Number(e.target.value) })}
                  style={{ width: "100%", borderRadius: 14, border: "1px solid #334155", background: "#020617", color: "#e5eefc", padding: "10px 12px" }}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                </select>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={controls.usePositional}
                    onChange={(e) => onControlsChange({ usePositional: e.target.checked })}
                  />
                  Add positional encoding
                </label>
                <div style={{ color: "#94a3b8", marginTop: 8 }}>
                  Self-attention requires token order information.
                </div>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={controls.causalMask}
                    onChange={(e) => onControlsChange({ causalMask: e.target.checked })}
                  />
                  Causal attention mask
                </label>
                <div style={{ color: "#94a3b8", marginTop: 8 }}>
                  No token can attend to future tokens.
                </div>
              </div>

              <div style={cardStyle}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={beginnerMode}
                    onChange={(e) => onBeginnerToggle(e.target.checked)}
                  />
                  Beginner explanation mode
                </label>
                <div style={{ color: "#94a3b8", marginTop: 8 }}>
                  Use simpler explanations and step guidance.
                </div>
              </div>
            </div>
          )}

          {section === "math" && (
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {mathSteps.map((step, index) => (
                <button
                  type="button"
                  key={step.title}
                  onClick={() => onStepChange(index)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: activeStep === index ? "1px solid #22d3ee" : "1px solid #334155",
                    background: activeStep === index ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
                    color: "#e5eefc",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Step {index + 1}</div>
                  <div style={{ fontWeight: 600 }}>{step.title}</div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={() => onToggle()}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "rgba(15,23,42,0.8)",
              color: "#e5eefc",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={() => onSectionChange("math")}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "rgba(15,23,42,0.8)",
              color: "#e5eefc",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            📘
          </button>
        </div>
      )}
    </div>
  );
}
