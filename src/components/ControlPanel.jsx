import React, { useState, useCallback } from "react";
import styles from "./ControlPanel.module.scss";
import clsx from "clsx";

const ControlPanel = ({ paramsRef, onExport, onImport, onParamsChange }) => {
  const [activeTab, setActiveTab] = useState("Blob");
  const [, setRerender] = useState(0);

  const updateParam = useCallback(
    (key, value) => {
      if (!paramsRef || !paramsRef.current) return;
      paramsRef.current[key] = value;
      setRerender((n) => n + 1);
      try {
        onParamsChange?.(key, value);
      } catch (e) {}
    },
    [paramsRef]
  );

  const p = paramsRef?.current ?? {};

  return (
    <div className={styles.pannelContainerInner}>
      <div className={styles.panelTop}>
        <div className={styles.tabButtons}>
          <button
            type="button"
            className={clsx(
              styles.tabBtn,
              activeTab === "Blob" && styles.active
            )}
            onClick={() => setActiveTab("Blob")}
          >
            Tracking
          </button>
          <button
            type="button"
            className={clsx(
              styles.tabBtn,
              activeTab === "Effect" && styles.active
            )}
            onClick={() => setActiveTab("Effect")}
          >
            Effect
          </button>
          <button
            type="button"
            className={clsx(
              styles.tabBtn,
              activeTab === "Export" && styles.active
            )}
            onClick={() => setActiveTab("Export")}
          >
            Export
          </button>
        </div>
      </div>

      <div className={styles.panelBody}>
        {activeTab === "Blob" && (
          <div className={styles.blobSettings}>
            <h4>Blob Detection</h4>
            <label>
              Threshold: {p.threshold}
              <input
                type="range"
                min="0"
                max="255"
                value={p.threshold}
                onChange={(e) =>
                  updateParam("threshold", parseInt(e.target.value, 10))
                }
              />
            </label>
            <label>
              Min Size: {p.minBlobSize}
              <input
                type="range"
                min="10"
                max="1000"
                value={p.minBlobSize}
                onChange={(e) =>
                  updateParam("minBlobSize", parseInt(e.target.value, 10) || 0)
                }
              />
            </label>
            <label>
              Max Blobs: {p.maxBlobs}
              <input
                type="range"
                min="1"
                max="50"
                value={p.maxBlobs}
                onChange={(e) =>
                  updateParam("maxBlobs", parseInt(e.target.value, 10) || 1)
                }
              />
            </label>
            <div className={styles.checkboxGroup}>
              <button
                className={clsx(
                  styles.toggleBtn,
                  !!p.showBlobs && styles.active
                )}
                type="button"
                onClick={() => updateParam("showBlobs", !p.showBlobs)}
              >
                Show Blobs
              </button>
              <button
                className={clsx(
                  styles.toggleBtn,
                  !!p.showOriginal && styles.active
                )}
                type="button"
                onClick={() => updateParam("showOriginal", !p.showOriginal)}
              >
                Show Original
              </button>
            </div>

            <h4>Blob Colors</h4>
            <label>
              Stroke:
              <input
                type="color"
                value={p.strokeStyle}
                onChange={(e) => updateParam("strokeStyle", e.target.value)}
              />
            </label>
            <label>
              Fill:
              <input
                type="color"
                value={p.fillStyle}
                onChange={(e) => updateParam("fillStyle", e.target.value)}
              />
            </label>
            <label>
              Border Width: {p.blobBorderWidth}
              <input
                type="range"
                min="0"
                max="20"
                value={p.blobBorderWidth}
                onChange={(e) =>
                  updateParam("blobBorderWidth", parseInt(e.target.value, 10))
                }
              />
            </label>
            <button
              className={clsx(
                styles.toggleBtn,
                !!p.blobCornerBorder && styles.active
              )}
              type="button"
              onClick={() =>
                updateParam("blobCornerBorder", !p.blobCornerBorder)
              }
            >
              Border Corners Only
            </button>
            {p.blobCornerBorder && (
              <label>
                Corner Length: {p.blobCornerLength}
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={p.blobCornerLength}
                  onChange={(e) =>
                    updateParam(
                      "blobCornerLength",
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </label>
            )}

            <h4>Blob Fill</h4>
            <div className={styles.fillModeGroup}>
              <div className={styles.fillModeLabel}>Fill Mode:</div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobFillMode === "none" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "none")}
                >
                  None
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobFillMode === "color" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "color")}
                >
                  Color
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobFillMode === "blur" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "blur")}
                >
                  Blur
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobFillMode === "both" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "both")}
                >
                  Color + Blur
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobFillMode === "zoom" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "zoom")}
                >
                  Zoom
                </button>
              </div>
            </div>
            <label>
              Blur Amount: {p.blobBlurAmount}
              <input
                type="range"
                min="1"
                max="30"
                value={p.blobBlurAmount}
                onChange={(e) =>
                  updateParam("blobBlurAmount", parseInt(e.target.value, 10))
                }
              />
            </label>
            <label>
              Zoom Level: {p.blobZoomLevel}
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={p.blobZoomLevel}
                onChange={(e) =>
                  updateParam("blobZoomLevel", parseFloat(e.target.value))
                }
              />
            </label>
            <label>
              Fill Opacity: {p.blobFillOpacity}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={p.blobFillOpacity}
                onChange={(e) =>
                  updateParam("blobFillOpacity", parseFloat(e.target.value))
                }
              />
            </label>

            <h4>Blob Labels</h4>
            <button
              className={clsx(
                styles.toggleBtn,
                p.showBlobLabels !== false && styles.active
              )}
              type="button"
              onClick={() =>
                updateParam("showBlobLabels", p.showBlobLabels === false)
              }
            >
              Show Labels
            </button>
            <label>
              Label Size: {p.blobLabelSize}
              <input
                type="range"
                min="8"
                max="32"
                value={p.blobLabelSize}
                onChange={(e) =>
                  updateParam("blobLabelSize", parseInt(e.target.value, 10))
                }
              />
            </label>
            <label>
              Label Color:
              <input
                type="color"
                value={p.blobLabelColor}
                onChange={(e) => updateParam("blobLabelColor", e.target.value)}
              />
            </label>
            <div className={styles.optionGroup}>
              <div className={styles.optionGroupLabel}>Font Family:</div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelFontFamily === "monospace" && styles.active
                  )}
                  type="button"
                  onClick={() =>
                    updateParam("blobLabelFontFamily", "monospace")
                  }
                >
                  Monospace
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelFontFamily === "cursive" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelFontFamily", "cursive")}
                >
                  Cursive
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelFontFamily === "sans-serif" && styles.active
                  )}
                  type="button"
                  onClick={() =>
                    updateParam("blobLabelFontFamily", "sans-serif")
                  }
                >
                  SansSerif
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelFontFamily === "serif" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelFontFamily", "serif")}
                >
                  Serif
                </button>
              </div>
            </div>
            <div className={styles.optionGroup}>
              <div className={styles.optionGroupLabel}>Label Content:</div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelMode === "coords" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelMode", "coords")}
                >
                  Coordinates
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelMode === "randomNumbers" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelMode", "randomNumbers")}
                >
                  Random Numbers
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelMode === "randomLetters" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelMode", "randomLetters")}
                >
                  Random Letters
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.blobLabelMode === "randomSymbols" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelMode", "randomSymbols")}
                >
                  Random Symbols
                </button>
              </div>
            </div>
            <button
              className={styles.importButton}
              type="button"
              onClick={() => onImport()}
            >
              Import Video
            </button>
          </div>
        )}

        {activeTab === "Effect" && (
          <div className={styles.effectSettings}>
            <h4>Connections (Beta)</h4>
            <button
              className={clsx(
                styles.toggleBtn,
                !!p.showConnections && styles.active
              )}
              type="button"
              onClick={() => updateParam("showConnections", !p.showConnections)}
            >
              Show Connections
            </button>
            <div className={styles.optionGroup}>
              <div className={styles.optionGroupLabel}>Style:</div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.connectionStyle === "normal" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("connectionStyle", "normal")}
                >
                  Normal
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.connectionStyle === "dashed" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("connectionStyle", "dashed")}
                >
                  Dashed
                </button>
                <button
                  className={clsx(
                    styles.optionBtn,
                    p.connectionStyle === "arrow" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("connectionStyle", "arrow")}
                >
                  Arrow
                </button>
              </div>
            </div>
            <label>
              Curvature: {p.connectionCurvature}
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={p.connectionCurvature}
                onChange={(e) =>
                  updateParam(
                    "connectionCurvature",
                    parseInt(e.target.value, 10)
                  )
                }
              />
            </label>
            <label>
              Color:
              <input
                type="color"
                value={p.connectionColor}
                onChange={(e) => updateParam("connectionColor", e.target.value)}
              />
            </label>
            <label>
              Width: {p.connectionWidth}
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={p.connectionWidth}
                onChange={(e) =>
                  updateParam("connectionWidth", parseFloat(e.target.value))
                }
              />
            </label>
            <label>
              Dash Length: {p.dashLength}
              <input
                type="range"
                min="1"
                max="50"
                value={p.dashLength}
                onChange={(e) =>
                  updateParam("dashLength", parseInt(e.target.value, 10) || 1)
                }
              />
            </label>
            <label>
              Dash Gap: {p.dashGap}
              <input
                type="range"
                min="1"
                max="50"
                value={p.dashGap}
                onChange={(e) =>
                  updateParam("dashGap", parseInt(e.target.value, 10) || 1)
                }
              />
            </label>
            <button
              className={styles.importButton}
              type="button"
              onClick={() => onImport()}
            >
              Import Video
            </button>
          </div>
        )}

        {activeTab === "Export" && (
          <div className={styles.exportSettings}>
            <h4>Export Settings</h4>
            <label>
              Video Bitrate (kbps): {p.videoBitrate}
              <input
                type="range"
                min="1000"
                max="20000"
                step="100"
                value={p.videoBitrate}
                onChange={(e) =>
                  updateParam(
                    "videoBitrate",
                    parseInt(e.target.value, 10) || 1000
                  )
                }
              />
            </label>
            <label>
              Audio Bitrate (kbps): {p.audioBitrate}
              <input
                type="range"
                min="64"
                max="320"
                step="8"
                value={p.audioBitrate}
                onChange={(e) =>
                  updateParam(
                    "audioBitrate",
                    parseInt(e.target.value, 10) || 128
                  )
                }
              />
            </label>
            <label>
              Export FPS: {p.exportFPS}
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={p.exportFPS}
                onChange={(e) =>
                  updateParam("exportFPS", parseInt(e.target.value, 10))
                }
              />
            </label>

            <div className={styles.exportActions}>
              <button type="button" onClick={() => onExport("webm")}>
                Export WEBM
              </button>
              <button type="button" onClick={() => onExport("mp4")}>
                Export MP4
              </button>
              <button
                className={styles.importButton}
                type="button"
                onClick={() => onImport()}
              >
                Import Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
