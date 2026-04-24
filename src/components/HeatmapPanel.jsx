import React, { useState } from "react";
import PlotCanvas from "./PlotCanvas.jsx";
import Modal from "./Modal.jsx";

export default function HeatmapPanel({ title, z, xLabels, yLabels, valueLabel = "value", selectedRow, selectedCol, onClick, expandable }) {
  const text = z.map((row, i) =>
    row.map(
      (value, j) =>
        `row: ${yLabels[i]}<br>col: ${xLabels[j]}<br>${valueLabel}: ${value.toFixed(3)}`
    )
  );

  const shapes = [];
  if (selectedRow !== undefined) {
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "y",
      x0: -0.5,
      x1: xLabels.length - 0.5,
      y0: selectedRow - 0.5,
      y1: selectedRow + 0.5,
      fillcolor: "rgba(34,211,238,0.14)",
      line: { width: 0 },
    });
  }
  if (selectedCol !== undefined) {
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "y",
      x0: selectedCol - 0.5,
      x1: selectedCol + 0.5,
      y0: -0.5,
      y1: yLabels.length - 0.5,
      fillcolor: "rgba(34,211,238,0.08)",
      line: { width: 0 },
    });
  }

  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ position: "relative", width: "100%" }}>
        {expandable && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 2,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid #334155",
              borderRadius: 12,
              color: "#e5eefc",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Expand
          </button>
        )}
        <PlotCanvas
          data={[
            {
              z,
              x: xLabels,
              y: yLabels,
              type: "heatmap",
              colorscale: "Blues",
              reversescale: false,
              text,
              hovertemplate: "%{text}<extra></extra>",
              showscale: true,
            },
          ]}
          layout={{
            title: { text: title, font: { size: 18, color: "#e5eefc" } },
            margin: { l: 60, r: 20, t: 50, b: 60 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#e5eefc" },
            xaxis: { side: "bottom", automargin: true },
            yaxis: { automargin: true, autorange: "reversed" },
            shapes,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%", minHeight: 340 }}
          onClick={onClick}
        />
      </div>
      {open && (
        <Modal open={open} title={title} onClose={() => setOpen(false)}>
          <PlotCanvas
            data={[
              {
                z,
                x: xLabels,
                y: yLabels,
                type: "heatmap",
                colorscale: "Blues",
                reversescale: false,
                text,
                hovertemplate: "%{text}<extra></extra>",
                showscale: true,
              },
            ]}
            layout={{
              title: { text: title, font: { size: 22, color: "#e5eefc" } },
              margin: { l: 80, r: 40, t: 70, b: 80 },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#e5eefc" },
              xaxis: { side: "bottom", automargin: true },
              yaxis: { automargin: true, autorange: "reversed" },
              shapes,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%", minHeight: 520 }}
          />
        </Modal>
      )}
    </>
  );
}
