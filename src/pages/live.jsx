import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { processVideoFrame } from "../utils/videoProcessing";
import styles from "../styles/live.module.scss";
import clsx from "clsx";
import SEO from "@/components/SEO";
import ControlPanel from "@/components/ControlPanel";
import { useTheme } from "@/contexts/ThemeContext";
import ViewControls from "@/components/ViewControls";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

const LiveBlobTracker = () => {
  const { isAltTheme, setIsAltTheme } = useTheme();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportInnerRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [blobs, setBlobs] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const panRafRef = useRef(null);
  const panStateRef = useRef({
    isPanning: false,
    lastX: 0,
    lastY: 0,
  });
  const [selectedCamera, setSelectedCamera] = useState("");
  const [availableCameras, setAvailableCameras] = useState([]);
  const [minimalMode, setMinimalMode] = useState(false);

  const params = useRef({
    threshold: 128,
    minBlobSize: 100,
    maxBlobs: 10,
    showBlobs: true,
    showOriginal: true,
    strokeStyle: "#ff0000",
    fillStyle: "#ffffff",
    blobBorderWidth: 2,
    blobCornerBorder: false,
    blobCornerLength: 20,
    blobFillMode: "none",
    blobBlurAmount: 6,
    blobFillOpacity: 0.35,
    blobZoomLevel: 2,
    showBlobLabels: true,
    blobLabelSize: 14,
    blobLabelColor: "#ffffff",
    blobLabelFontFamily: "monospace",
    blobLabelMode: "coords",
    showConnections: false,
    connectionStyle: "normal",
    connectionCurvature: 0,
    connectionColor: "#ffffff",
    connectionWidth: 2,
    connectionFromEdge: true,
    dashLength: 10,
    dashGap: 5,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        console.log("Cameras detected:", videoDevices.length);
        videoDevices.forEach((device, index) => {
          console.log(
            `Camera ${index + 1}:`,
            device.label || `Camera ${device.deviceId.slice(0, 8)}`
          );
        });

        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating devices:", error);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      }
    };

    getCameras();
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        processVideoFrame(video, canvas, params.current, setBlobs);
      } catch (e) {
        console.error("Error processing frame:", e);
      }
    }

    if (animationFrameRef.current !== null) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, []);

  useEffect(() => {
    if (cameraActive && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraActive, processFrame]);

  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setCameraError("");
    } else {
      try {
        const constraints = {
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;

          const onLoadedMetadata = () => {
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            video
              .play()
              .then(() => {
                setCameraActive(true);
                setCameraError("");
              })
              .catch((err) => {
                console.error("Error playing video:", err);
                setCameraError("Error starting video: " + err.message);
              });
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);

          setTimeout(() => {
            if (video.readyState >= 2 && !cameraActive) {
              onLoadedMetadata();
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setCameraError(
          error.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access in your browser settings."
            : error.name === "NotFoundError"
            ? "No camera found. Please connect a camera and try again."
            : `Error: ${error.message}`
        );
      }
    }
  }, [cameraActive, selectedCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "KeyB") {
        e.preventDefault();
        setMinimalMode((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isFullscreen = !!document.fullscreenElement;
    if (minimalMode && !isFullscreen) {
      el.requestFullscreen?.().catch(() => {});
    } else if (!minimalMode && isFullscreen) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [minimalMode]);

  useEffect(() => {
    if (minimalMode) {
      setZoom(1);
      const origin = { x: 0, y: 0 };
      panRef.current = origin;
      setPan(origin);
    }
  }, [minimalMode]);

  useEffect(() => {
    if (viewportInnerRef.current) {
      viewportInnerRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoom})`;
    }
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
    };
  }, []);

  const enqueuePanUpdate = useCallback(
    (nextPan) => {
      panRef.current = nextPan;
      if (viewportInnerRef.current) {
        viewportInnerRef.current.style.transform = `translate(${nextPan.x}px, ${nextPan.y}px) scale(${zoom})`;
      }
    },
    [zoom]
  );

  const clampZoom = useCallback((value) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => clampZoom(prev + ZOOM_STEP));
  }, [clampZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => clampZoom(prev - ZOOM_STEP));
  }, [clampZoom]);

  const handleZoomSliderChange = useCallback(
    (e) => {
      setZoom(clampZoom(parseFloat(e.target.value)));
    },
    [clampZoom]
  );

  const handleResetView = useCallback(() => {
    setZoom(1);
    const origin = { x: 0, y: 0 };
    panRef.current = origin;
    setPan(origin);
  }, []);

  const handleWheelZoom = useCallback(
    (e) => {
      if (!cameraActive) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const delta = direction * (ZOOM_STEP * 0.75);
      setZoom((prev) => clampZoom(prev + delta));
    },
    [clampZoom, cameraActive]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (!cameraActive || zoom === 1) return;
      panStateRef.current.isPanning = true;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    },
    [cameraActive, zoom]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!panStateRef.current.isPanning || zoom === 1) return;
      e.preventDefault?.();
      const dx = (e.clientX - panStateRef.current.lastX) / zoom;
      const dy = (e.clientY - panStateRef.current.lastY) / zoom;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      enqueuePanUpdate({
        x: panRef.current.x + dx,
        y: panRef.current.y + dy,
      });
    },
    [zoom, enqueuePanUpdate]
  );

  const handlePointerUp = useCallback((e) => {
    panStateRef.current.isPanning = false;
    if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }, []);

  const handleParamsChange = useCallback(() => {}, []);

  const handleCameraChange = useCallback(
    (e) => {
      const newCameraId = e.target.value;
      setSelectedCamera(newCameraId);

      if (cameraActive && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setCameraActive(false);

        setTimeout(async () => {
          try {
            const constraints = {
              video: {
                deviceId: newCameraId ? { exact: newCameraId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            };

            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );
            streamRef.current = stream;

            const video = videoRef.current;
            if (video) {
              video.srcObject = stream;
              video.onloadedmetadata = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                }
                video.play().then(() => {
                  setCameraActive(true);
                });
              };
            }
          } catch (error) {
            console.error("Error switching camera:", error);
            setCameraError("Error switching camera: " + error.message);
          }
        }, 100);
      }
    },
    [cameraActive]
  );

  return (
    <>
      <SEO
        title="Live Blob Tracking"
        description="Real-time blob detection and tracking using your webcam"
      />
      <section
        className={clsx(
          styles.containerTracking,
          isAltTheme && styles.containerTrackingAlt,
          minimalMode && styles.minimalMode
        )}
      >
        {!minimalMode && (
          <div className={styles.pannelContainer}>
            <ControlPanel
              paramsRef={params}
              onParamsChange={handleParamsChange}
              blobsLength={blobs.length}
            />
          </div>
        )}
        <div
          className={clsx(
            styles.page,
            isAltTheme && styles.pageAlt,
            minimalMode && styles.pageMinimal
          )}
        >
          {!minimalMode && (
            <div className={styles.header}>
              <p
                className={
                  isAltTheme ? styles.authorTextAlt : styles.authorText
                }
              >
                Made by{" "}
                <a
                  href="https://amezirmessaoud.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    isAltTheme ? styles.authorLinkAlt : styles.authorLink
                  }
                >
                  Amezir Messaoud
                </a>
              </p>
              <Link
                href="/"
                className={`${styles.logoTitle} ${
                  isAltTheme ? styles.logoTitleAlt : ""
                }`}
              >
                <img
                  src="./logo.png"
                  alt="logo"
                  className={styles.logo}
                  draggable="false"
                />
                <h1>Tayri Motion - Live</h1>
              </Link>
              <button
                type="button"
                className={`${styles.toggleButton} ${
                  isAltTheme ? styles.toggleButtonAlt : ""
                }`}
                onClick={() => setIsAltTheme((prev) => !prev)}
              >
                {isAltTheme ? "dark\u00A0" : "light"}
              </button>
            </div>
          )}
          <div ref={containerRef} className={styles.container}>
            <div
              className={clsx(
                styles.viewport,
                isAltTheme && styles.viewportAlt
              )}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div
                ref={viewportInnerRef}
                className={styles.viewportInner}
                style={{
                  transform: `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoom})`,
                  cursor:
                    zoom !== 1
                      ? panStateRef.current?.isPanning
                        ? "grabbing"
                        : "grab"
                      : "default",
                }}
              >
                <video
                  ref={videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    transform: mirrorCamera ? "scaleX(-1)" : "none",
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className={styles.canvas}
                  style={{
                    transform: mirrorCamera ? "scaleX(-1)" : "none",
                  }}
                />
              </div>
            </div>

            {!minimalMode && (
              <div className={styles.cameraControls}>
                <div className={styles.cameraSelect}>
                  <label htmlFor="camera-select">Camera:</label>
                  <select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={handleCameraChange}
                    disabled={cameraActive}
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label ||
                          `Camera ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={toggleCamera}
                  className={clsx(styles.cameraButton, {
                    [styles.active]: cameraActive,
                  })}
                >
                  {cameraActive ? "Stop Camera" : "Start Camera"}
                </button>

                <button
                  onClick={() => setMirrorCamera(!mirrorCamera)}
                  className={styles.cameraButton}
                  disabled={!cameraActive}
                >
                  {mirrorCamera ? "🪞 Mirror ON" : "🪞 Mirror OFF"}
                </button>

                {cameraError && (
                  <div className={styles.errorMessage}>{cameraError}</div>
                )}
              </div>
            )}
          </div>
          {!minimalMode && (
            <ViewControls
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomChange={handleZoomSliderChange}
              onReset={handleResetView}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default LiveBlobTracker;
