import React, { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

export default function PlotCanvas({ data, layout, config, style, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    Plotly.react(el, data, layout, { responsive: true, displayModeBar: false, ...config });

    const resize = () => {
      if (el) Plotly.Plots.resize(el);
    };

    const ro = new ResizeObserver(() => {
      resize();
    });

    ro.observe(el);
    window.addEventListener("resize", resize);

    const handleClick = (eventData) => {
      if (typeof onClick === "function") {
        onClick(eventData);
      }
    };

    if (typeof onClick === "function") {
      el.on("plotly_click", handleClick);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      if (el && typeof el.removeAllListeners === "function") {
        el.removeAllListeners("plotly_click");
      }
      if (el) Plotly.purge(el);
    };
  }, [data, layout, config, onClick]);

  return <div ref={ref} style={{ width: "100%", minWidth: 0, ...style }} />;
}
