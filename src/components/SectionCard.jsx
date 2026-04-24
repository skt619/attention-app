import React from "react";

const cardStyle = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid #334155",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 18px 30px rgba(0,0,0,0.18)",
};

export default function SectionCard({ title, children, subtitle }) {
  return (
    <section style={cardStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle && (
          <p style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 1.6 }}>{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
