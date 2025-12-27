import React, { useState, useCallback } from "react";
import styles from "./ControlPanel.module.scss";
import clsx from "clsx";
import { useTheme } from "@/contexts/ThemeContext";
import ResetButton from "./ResetButton";

const ControlPanel = ({
  paramsRef,
  onExport,
  onImport,
  onParamsChange,
  enableExport = true,
  enableImport = true,
}) => {
  const [activeTab, setActiveTab] = useState("Blob");
  const [, setRerender] = useState(0);
  const { isAltTheme } = useTheme();

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
    <div
      className={clsx(
        styles.pannelContainerInner,
        isAltTheme && styles.pannelContainerInnerAlt
      )}
    >
      <div className={styles.panelTop}>
        <div className={styles.tabButtons}>
          <button
            type="button"
            className={clsx(
              styles.tabBtn,
              isAltTheme && styles.tabBtnAlt,
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
              isAltTheme && styles.tabBtnAlt,
              activeTab === "Effect" && styles.active
            )}
            onClick={() => setActiveTab("Effect")}
          >
            Effect
          </button>
          {enableExport && (
            <button
              type="button"
              className={clsx(
                styles.tabBtn,
                isAltTheme && styles.tabBtnAlt,
                activeTab === "Export" && styles.active
              )}
              onClick={() => setActiveTab("Export")}
            >
              Export
            </button>
          )}
        </div>
      </div>

      <div
        className={clsx(styles.panelBody, isAltTheme && styles.panelBodyAlt)}
      >
        {activeTab === "Blob" && (
          <div className={styles.blobSettings}>
            <h4 className={isAltTheme ? styles.altTheme : ""}>
              Blob Detection
            </h4>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Threshold: {p.threshold}
              <input
                type="range"
                name="threshold"
                min="0"
                max="255"
                value={p.threshold}
                onChange={(e) =>
                  updateParam("threshold", parseInt(e.target.value, 10))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Min Size: {p.minBlobSize}
              <input
                type="range"
                name="minBlobSize"
                min="10"
                max="1000"
                value={p.minBlobSize}
                onChange={(e) =>
                  updateParam("minBlobSize", parseInt(e.target.value, 10) || 0)
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Max Blobs: {p.maxBlobs}
              <input
                type="range"
                name="maxBlobs"
                min="1"
                max="50"
                value={p.maxBlobs}
                onChange={(e) =>
                  updateParam("maxBlobs", parseInt(e.target.value, 10) || 1)
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <div className={styles.checkboxGroup}>
              <button
                className={clsx(
                  isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn,
                  !!p.showBlobs && styles.active
                )}
                type="button"
                onClick={() => updateParam("showBlobs", !p.showBlobs)}
              >
                Show Blobs
              </button>
              <button
                className={clsx(
                  isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn,
                  !!p.showOriginal && styles.active
                )}
                type="button"
                onClick={() => updateParam("showOriginal", !p.showOriginal)}
              >
                Show Original
              </button>
            </div>
            <ResetButton
              keys={[
                "threshold",
                "minBlobSize",
                "maxBlobs",
                "showBlobs",
                "showOriginal",
              ]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />

            <h4 className={isAltTheme ? styles.altTheme : ""}>Blob Colors</h4>
            <label
              className={clsx(
                styles.colorLabel,
                isAltTheme && styles.colorLabelAlt
              )}
            >
              <span>Stroke:</span>
              <div className={styles.colorInputGroup}>
                <input
                  type="text"
                  name="strokeStyleHex"
                  className={clsx(
                    styles.hexInput,
                    isAltTheme && styles.hexInputAlt
                  )}
                  value={p.strokeStyle}
                  onChange={(e) => updateParam("strokeStyle", e.target.value)}
                  placeholder="#000000"
                  maxLength="7"
                />
                <input
                  type="color"
                  name="strokeStylePicker"
                  value={p.strokeStyle}
                  onChange={(e) => updateParam("strokeStyle", e.target.value)}
                />
              </div>
            </label>
            <label
              className={clsx(
                styles.colorLabel,
                isAltTheme && styles.colorLabelAlt
              )}
            >
              <span>Fill:</span>
              <div className={styles.colorInputGroup}>
                <input
                  type="text"
                  name="fillStyleHex"
                  className={clsx(
                    styles.hexInput,
                    isAltTheme && styles.hexInputAlt
                  )}
                  value={p.fillStyle}
                  onChange={(e) => updateParam("fillStyle", e.target.value)}
                  placeholder="#FFFFFF"
                  maxLength="7"
                />
                <input
                  type="color"
                  name="fillStylePicker"
                  value={p.fillStyle}
                  onChange={(e) => updateParam("fillStyle", e.target.value)}
                />
              </div>
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Border Width: {p.blobBorderWidth}
              <input
                type="range"
                name="blobBorderWidth"
                min="0"
                max="20"
                value={p.blobBorderWidth}
                onChange={(e) =>
                  updateParam("blobBorderWidth", parseInt(e.target.value, 10))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <button
              className={clsx(
                isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn,
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
              <label className={isAltTheme ? styles.altTheme : ""}>
                Corner Length: {p.blobCornerLength}
                <input
                  type="range"
                  name="blobCornerLength"
                  min="5"
                  max="50"
                  value={p.blobCornerLength}
                  onChange={(e) =>
                    updateParam(
                      "blobCornerLength",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className={isAltTheme ? styles.altTheme : ""}
                />
              </label>
            )}
            <ResetButton
              keys={[
                "strokeStyle",
                "fillStyle",
                "blobBorderWidth",
                "blobCornerBorder",
                "blobCornerLength",
              ]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />
            <h4 className={isAltTheme ? styles.altTheme : ""}>Blob Labels</h4>
            <button
              className={clsx(
                isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn,
                p.showBlobLabels !== false && styles.active
              )}
              type="button"
              onClick={() =>
                updateParam("showBlobLabels", p.showBlobLabels === false)
              }
            >
              Show Labels
            </button>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Label Size: {p.blobLabelSize}
              <input
                type="range"
                name="blobLabelSize"
                min="8"
                max="32"
                value={p.blobLabelSize}
                onChange={(e) =>
                  updateParam("blobLabelSize", parseInt(e.target.value, 10))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label
              className={clsx(
                styles.colorLabel,
                isAltTheme && styles.colorLabelAlt
              )}
            >
              <span>Label Color:</span>
              <div className={styles.colorInputGroup}>
                <input
                  type="text"
                  name="blobLabelColorHex"
                  className={clsx(
                    styles.hexInput,
                    isAltTheme && styles.hexInputAlt
                  )}
                  value={p.blobLabelColor}
                  onChange={(e) =>
                    updateParam("blobLabelColor", e.target.value)
                  }
                  placeholder="#FFFFFF"
                  maxLength="7"
                />
                <input
                  type="color"
                  name="blobLabelColorPicker"
                  value={p.blobLabelColor}
                  onChange={(e) =>
                    updateParam("blobLabelColor", e.target.value)
                  }
                />
              </div>
            </label>
            <div className={styles.optionGroup}>
              <div
                className={clsx(
                  styles.optionGroupLabel,
                  isAltTheme && styles.optionGroupLabelAlt
                )}
              >
                Font Family:
              </div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
              <div
                className={clsx(
                  styles.optionGroupLabel,
                  isAltTheme && styles.optionGroupLabelAlt
                )}
              >
                Label Content:
              </div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
                    p.blobLabelMode === "randomSymbols" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobLabelMode", "randomSymbols")}
                >
                  Random Symbols
                </button>
              </div>
            </div>
            <ResetButton
              keys={[
                "showBlobLabels",
                "blobLabelSize",
                "blobLabelColor",
                "blobLabelFontFamily",
                "blobLabelMode",
              ]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />
            {enableImport && (
              <button
                className={clsx(
                  styles.importButton,
                  isAltTheme && styles.importButtonAlt
                )}
                type="button"
                onClick={() => onImport?.()}
              >
                Import Video
              </button>
            )}
          </div>
        )}

        {activeTab === "Effect" && (
          <div className={styles.effectSettings}>
            <h4 className={isAltTheme ? styles.altTheme : ""}>Blob Fill</h4>
            <div className={styles.fillModeGroup}>
              <div
                className={clsx(
                  styles.fillModeLabel,
                  isAltTheme && styles.fillModeLabelAlt
                )}
              >
                Fill Mode:
              </div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
                    p.blobFillMode === "zoom" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("blobFillMode", "zoom")}
                >
                  Zoom
                </button>
              </div>
            </div>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Blur Amount: {p.blobBlurAmount}
              <input
                type="range"
                name="blobBlurAmount"
                min="1"
                max="30"
                value={p.blobBlurAmount}
                onChange={(e) =>
                  updateParam("blobBlurAmount", parseInt(e.target.value, 10))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Zoom Level: {p.blobZoomLevel}
              <input
                type="range"
                name="blobZoomLevel"
                min="1"
                max="5"
                step="0.5"
                value={p.blobZoomLevel}
                onChange={(e) =>
                  updateParam("blobZoomLevel", parseFloat(e.target.value))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Fill Opacity: {p.blobFillOpacity}
              <input
                type="range"
                name="blobFillOpacity"
                min="0"
                max="1"
                step="0.05"
                value={p.blobFillOpacity}
                onChange={(e) =>
                  updateParam("blobFillOpacity", parseFloat(e.target.value))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <ResetButton
              keys={[
                "blobFillMode",
                "blobBlurAmount",
                "blobZoomLevel",
                "blobFillOpacity",
              ]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />
            <h4 className={isAltTheme ? styles.altTheme : ""}>
              Connections (Beta)
            </h4>
            <button
              className={clsx(
                isAltTheme ? styles.toggleBtnAlt : styles.toggleBtn,
                !!p.showConnections && styles.active
              )}
              type="button"
              onClick={() => updateParam("showConnections", !p.showConnections)}
            >
              Show Connections
            </button>
            <div className={styles.optionGroup}>
              <div
                className={clsx(
                  styles.optionGroupLabel,
                  isAltTheme && styles.optionGroupLabelAlt
                )}
              >
                Style:
              </div>
              <div className={styles.optionGroupButtons}>
                <button
                  className={clsx(
                    styles.optionBtn,
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
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
                    isAltTheme && styles.optionBtnAlt,
                    p.connectionStyle === "arrow" && styles.active
                  )}
                  type="button"
                  onClick={() => updateParam("connectionStyle", "arrow")}
                >
                  Arrow
                </button>
              </div>
            </div>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Curvature: {p.connectionCurvature}
              <input
                type="range"
                name="connectionCurvature"
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
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label
              className={clsx(
                styles.colorLabel,
                isAltTheme && styles.colorLabelAlt
              )}
            >
              <span>Color:</span>
              <div className={styles.colorInputGroup}>
                <input
                  type="text"
                  name="connectionColorHex"
                  className={clsx(
                    styles.hexInput,
                    isAltTheme && styles.hexInputAlt
                  )}
                  value={p.connectionColor}
                  onChange={(e) =>
                    updateParam("connectionColor", e.target.value)
                  }
                  placeholder="#FFFFFF"
                  maxLength="7"
                />
                <input
                  type="color"
                  name="connectionColorPicker"
                  value={p.connectionColor}
                  onChange={(e) =>
                    updateParam("connectionColor", e.target.value)
                  }
                />
              </div>
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Width: {p.connectionWidth}
              <input
                type="range"
                name="connectionWidth"
                min="1"
                max="10"
                step="0.5"
                value={p.connectionWidth}
                onChange={(e) =>
                  updateParam("connectionWidth", parseFloat(e.target.value))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Dash Length: {p.dashLength}
              <input
                type="range"
                name="dashLength"
                min="1"
                max="50"
                value={p.dashLength}
                onChange={(e) =>
                  updateParam("dashLength", parseInt(e.target.value, 10) || 1)
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Dash Gap: {p.dashGap}
              <input
                type="range"
                name="dashGap"
                min="1"
                max="50"
                value={p.dashGap}
                onChange={(e) =>
                  updateParam("dashGap", parseInt(e.target.value, 10) || 1)
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Distance Limit: {p.maxConnectionDistance || 300}
              <input
                type="range"
                name="maxConnectionDistance"
                min="50"
                max="1000"
                step="10"
                value={p.maxConnectionDistance || 300}
                onChange={(e) =>
                  updateParam(
                    "maxConnectionDistance",
                    parseInt(e.target.value, 10)
                  )
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <ResetButton
              keys={[
                "showConnections",
                "connectionStyle",
                "connectionCurvature",
                "connectionColor",
                "connectionWidth",
                "dashLength",
                "dashGap",
                "maxConnectionDistance",
              ]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />
            {enableImport && (
              <button
                className={clsx(
                  styles.importButton,
                  isAltTheme && styles.importButtonAlt
                )}
                type="button"
                onClick={() => onImport?.()}
              >
                Import Video
              </button>
            )}
          </div>
        )}

        {enableExport && activeTab === "Export" && (
          <div className={styles.exportSettings}>
            <h4 className={isAltTheme ? styles.altTheme : ""}>
              Export Settings
            </h4>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Video Bitrate (kbps): {p.videoBitrate}
              <input
                type="range"
                name="videoBitrate"
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
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Audio Bitrate (kbps): {p.audioBitrate}
              <input
                type="range"
                name="audioBitrate"
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
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <label className={isAltTheme ? styles.altTheme : ""}>
              Export FPS: {p.exportFPS}
              <input
                type="range"
                name="exportFPS"
                min="15"
                max="60"
                step="1"
                value={p.exportFPS}
                onChange={(e) =>
                  updateParam("exportFPS", parseInt(e.target.value, 10))
                }
                className={isAltTheme ? styles.altTheme : ""}
              />
            </label>
            <ResetButton
              keys={["videoBitrate", "audioBitrate", "exportFPS"]}
              paramsRef={paramsRef}
              updateParam={updateParam}
              isAltTheme={isAltTheme}
            />
            <div className={styles.exportActions}>
              <div className={styles.exportButtons}>
                <button type="button" onClick={() => onExport?.("webm")}>
                  Export WEBM
                </button>
                <button type="button" onClick={() => onExport?.("mp4")}>
                  Export MP4
                </button>
              </div>
              {enableImport && (
                <button
                  className={clsx(
                    styles.importButton,
                    isAltTheme && styles.importButtonAlt
                  )}
                  type="button"
                  onClick={() => onImport?.()}
                >
                  Import Video
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
