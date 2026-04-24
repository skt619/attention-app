import React from "react";
import PlotCanvas from "./PlotCanvas.jsx";

export default function LineChartPanel({ title, traces, xLabel, yLabel }) {
  return (
    <PlotCanvas
      data={traces}
      layout={{
        title: { text: title, font: { size: 18, color: "#e5eefc" } },
        margin: { l: 60, r: 20, t: 50, b: 50 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#e5eefc" },
        xaxis: { title: xLabel, automargin: true },
        yaxis: { title: yLabel, automargin: true },
      }}
      style={{ width: "100%", minHeight: 340 }}
    />
  );
}
