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
            Blob
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
          <div>
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
            <label>
              <input
                type="checkbox"
                checked={!!p.showBlobs}
                onChange={(e) => updateParam("showBlobs", e.target.checked)}
              />
              Show Blobs
            </label>
            <label>
              <input
                type="checkbox"
                checked={!!p.showOriginal}
                onChange={(e) => updateParam("showOriginal", e.target.checked)}
              />
              Show Original
            </label>

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
                min="1"
                max="20"
                value={p.blobBorderWidth}
                onChange={(e) =>
                  updateParam("blobBorderWidth", parseInt(e.target.value, 10))
                }
              />
            </label>

            <h4>Blob Fill</h4>
            <label>
              Fill Mode:
              <select
                value={p.blobFillMode}
                onChange={(e) => updateParam("blobFillMode", e.target.value)}
              >
                <option value="none">None</option>
                <option value="color">Color</option>
                <option value="blur">Blur</option>
                <option value="both">Color + Blur</option>
                <option value="zoom">Zoom</option>
              </select>
            </label>
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
            <label>
              Label Color:
              <input
                type="color"
                value={p.blobLabelColor}
                onChange={(e) => updateParam("blobLabelColor", e.target.value)}
              />
            </label>
            <label>
              Font Family:
              <select
                value={p.blobLabelFontFamily}
                onChange={(e) =>
                  updateParam("blobLabelFontFamily", e.target.value)
                }
              >
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive</option>
                <option value="sans-serif">SansSerif</option>
                <option value="serif">Serif</option>
              </select>
            </label>
            <label>
              Label Content:
              <select
                value={p.blobLabelMode}
                onChange={(e) => updateParam("blobLabelMode", e.target.value)}
              >
                <option value="coords">Coordinates</option>
                <option value="randomNumbers">Random Numbers</option>
                <option value="randomLetters">Random Letters</option>
                <option value="randomSymbols">Random Symbols</option>
              </select>
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

        {activeTab === "Effect" && (
          <div>
            <h4>Connections (Beta)</h4>
            <label>
              <input
                type="checkbox"
                checked={!!p.showConnections}
                onChange={(e) =>
                  updateParam("showConnections", e.target.checked)
                }
              />
              Show Connections
            </label>
            <label>
              Style:
              <select
                value={p.connectionStyle}
                onChange={(e) => updateParam("connectionStyle", e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="dashed">Dashed</option>
                <option value="arrow">Arrow</option>
              </select>
            </label>
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
          <div>
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
