import React from "react";
import clsx from "clsx";
import styles from "./ViewControls.module.scss";

const ViewControls = ({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onReset,
  isAltTheme,
}) => {
  return (
    <div
      className={clsx(
        styles.viewControls,
        isAltTheme && styles.viewControlsAlt
      )}
    >
      <div className={styles.zoomButtons}>
        <button type="button" onClick={onZoomOut} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in">
          +
        </button>
      </div>
      <input
        type="range"
        id="zoom-slider"
        name="zoom"
        min={minZoom}
        max={maxZoom}
        step={0.05}
        value={zoom}
        onChange={onZoomChange}
        className={styles.zoomSlider}
        aria-label="Zoom level"
      />
      <div className={styles.zoomValue}>x{zoom.toFixed(2)}</div>
      <button type="button" onClick={onReset} className={styles.resetView}>
        Reset
      </button>
    </div>
  );
};

export default ViewControls;
