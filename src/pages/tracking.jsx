import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { processVideoFrame } from "../utils/videoProcessing";
import { exportVideo, formatTime } from "../utils/videoExport";
import styles from "../styles/trancking.module.scss";
import clsx from "clsx";
import SEO from "@/components/SEO";
import ControlPanel from "@/components/ControlPanel";
import { useTheme } from "@/contexts/ThemeContext";
import ViewControls from "@/components/ViewControls";
import VideoControls from "@/components/VideoControls";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

const BlobTracker = () => {
  const { isAltTheme } = useTheme();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const paneRef = useRef(null);
  const [blobs, setBlobs] = useState([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTimeRemaining, setExportTimeRemaining] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const exportAbortControllerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const panRafRef = useRef(null);
  const panStateRef = useRef({
    isPanning: false,
    lastX: 0,
    lastY: 0,
  });

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
    videoBitrate: 5000,
    audioBitrate: 128,
    exportFPS: 30,
    showConnections: false,
    connectionStyle: "normal",
    connectionCurvature: 0,
    connectionColor: "#ffffff",
    connectionWidth: 2,
    connectionFromEdge: true,
    dashLength: 10,
    dashGap: 5,
  });

  const handleExportVideo = useCallback(
    async (preferredFormat = "webm") => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !videoLoaded) {
        alert("Please load a video first");
        return;
      }

      setExporting(true);
      setExportProgress(0);
      setExportStatus("Preparing export...");

      const abortController = new AbortController();
      exportAbortControllerRef.current = abortController;

      await exportVideo(
        video,
        canvas,
        params.current,
        {
          onProgress: setExportProgress,
          onStatus: setExportStatus,
          onTimeRemaining: setExportTimeRemaining,
          onCanceled: () => {
            setExportStatus("Export canceled");
            setExporting(false);
            exportAbortControllerRef.current = null;
            setExportProgress(0);
          },
          onComplete: () => {
            exportAbortControllerRef.current = null;
            setTimeout(() => setExporting(false), 2000);
          },
          onError: (error) => {
            exportAbortControllerRef.current = null;
            alert(
              "Error while exporting the video: " +
                (error?.message || String(error))
            );
            setExporting(false);
          },
        },
        abortController.signal,
        preferredFormat
      );
    },
    [videoLoaded]
  );

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    return () => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
    };
  }, []);

  const enqueuePanUpdate = useCallback((nextPan) => {
    panRef.current = nextPan;
    if (panRafRef.current) return;
    panRafRef.current = requestAnimationFrame(() => {
      panRafRef.current = null;
      setPan(panRef.current);
    });
  }, []);

  const handleCancelExport = useCallback(() => {
    if (exportAbortControllerRef.current) {
      setExportStatus("Cancelling export...");
      exportAbortControllerRef.current.abort();
    }
  }, []);

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
      if (!videoLoaded) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const delta = direction * (ZOOM_STEP * 0.75);
      setZoom((prev) => clampZoom(prev + delta));
    },
    [clampZoom, videoLoaded]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (!videoLoaded || zoom === 1) return;
      panStateRef.current.isPanning = true;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    },
    [videoLoaded, zoom]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!panStateRef.current.isPanning || zoom === 1) return;
      e.preventDefault();
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

  const handleParamsChange = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      try {
        processVideoFrame(video, canvas, params.current, setBlobs);
      } catch (e) {}
    }
  }, []);

  const handlePlay = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
      setCurrentTime(video.currentTime);
    }
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const video = videoRef.current;
      if (video) {
        const canvas = canvasRef.current;
        setVideoLoaded(false);
        setZoom(1);
        const origin = { x: 0, y: 0 };
        panRef.current = origin;
        setPan(origin);
        video.src = url;
        video.load();

        const onLoaded = () => {
          const vw = video.videoWidth || 1280;
          const vh = video.videoHeight || 720;
          if (canvas) {
            canvas.width = vw;
            canvas.height = vh;
            canvas.style.width = "";
            canvas.style.height = "";
          }
          setDuration(video.duration || 0);
          setVideoLoaded(true);
          try {
            const playPromise = video.play();
            if (
              playPromise !== undefined &&
              typeof playPromise.then === "function"
            ) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                })
                .catch((err) => {
                  try {
                    video.muted = true;
                    video
                      .play()
                      .then(() => {
                        setIsPlaying(true);
                      })
                      .catch(() => {});
                  } catch (e) {}
                });
            }
          } catch (e) {}
          video.removeEventListener("loadedmetadata", onLoaded);
        };

        video.addEventListener("loadedmetadata", onLoaded);
      }
    }
  };

  useEffect(() => {
    if (!videoLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1150;
    canvas.height = video.videoHeight || 720;

    let animationId = null;

    const processFrame = () => {
      if (!video.paused && !video.ended) {
        processVideoFrame(video, canvas, params.current, setBlobs);
        animationId = requestAnimationFrame(processFrame);
      }
    };

    const handlePlayEvent = () => {
      setIsPlaying(true);
      processFrame();
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
      try {
        processVideoFrame(video, canvas, params.current, setBlobs);
      } catch (e) {}
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener("play", handlePlayEvent);
    video.addEventListener("pause", handlePauseEvent);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);

    if (!video.paused) {
      processFrame();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      video.removeEventListener("play", handlePlayEvent);
      video.removeEventListener("pause", handlePauseEvent);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, [videoLoaded]);

  useEffect(() => {
    const stopPan = () => handlePointerUp();
    window.addEventListener("mouseup", stopPan);
    window.addEventListener("touchend", stopPan);
    window.addEventListener("touchcancel", stopPan);
    return () => {
      window.removeEventListener("mouseup", stopPan);
      window.removeEventListener("touchend", stopPan);
      window.removeEventListener("touchcancel", stopPan);
    };
  }, [handlePointerUp]);

  return (
    <>
      <SEO
        title="Blob Tracking - Tayri Motion"
        description="Track and visualize blobs in your videos with ease."
      />
      <section
        className={clsx(
          styles.containerTracking,
          isAltTheme && styles.containerTrackingAlt
        )}
      >
        <div className={styles.pannelContainer}>
          <ControlPanel
            paramsRef={params}
            onExport={handleExportVideo}
            onParamsChange={handleParamsChange}
            onCancel={handleCancelExport}
            onImport={() => document.getElementById("videoInput")?.click()}
            blobsLength={blobs.length}
          />
        </div>
        <div className={clsx(styles.page, isAltTheme && styles.pageAlt)}>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className={styles.videoInput}
          />

          <div ref={containerRef} className={styles.container}>
            <div
              className={clsx(
                styles.viewport,
                isAltTheme && styles.viewportAlt
              )}
              onWheel={handleWheelZoom}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div
                className={styles.viewportInner}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
                  loop
                  playsInline
                />

                <canvas ref={canvasRef} className={styles.canvas} />
              </div>
            </div>
            {!videoLoaded && (
              <div
                className={clsx(
                  styles.importOverlay,
                  isAltTheme && styles.importOverlayAlt
                )}
              >
                <div className={styles.infoUse}>
                  ️<p className={styles.useTitle}>How to use</p>
                  <ul className={styles.useList}>
                    <li>01. Upload file</li>
                    <li>02. Edit</li>
                    <li>03. Download</li>
                  </ul>
                </div>
                <button
                  onClick={() => document.getElementById("videoInput")?.click()}
                  className={clsx(
                    styles.importButton,
                    isAltTheme && styles.importButtonAlt
                  )}
                >
                  Import Video
                </button>
                <Link
                  type="button"
                  href="/"
                  className={clsx(
                    styles.leaveButton,
                    isAltTheme && styles.leaveButtonAlt
                  )}
                >
                  Back to Home
                </Link>
              </div>
            )}

            {exporting && (
              <div className={styles.exportOverlay}>
                <img src="./logo.png" alt="logo" draggable="false" />
                <div className={styles.exportStatus}>{exportStatus}</div>

                <div className={styles.progressBarContainer}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>

                <div className={styles.progressPercent}>
                  {exportProgress.toFixed(1)}%
                </div>

                <div className={styles.timeRemaining}>
                  Time remaining: {formatTime(exportTimeRemaining)}
                </div>

                <button
                  type="button"
                  className={styles.exportCancelButton}
                  onClick={handleCancelExport}
                >
                  Cancel export
                </button>
              </div>
            )}
          </div>
          {videoLoaded && (
            <ViewControls
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomChange={handleZoomSliderChange}
              onReset={handleResetView}
              isAltTheme={isAltTheme}
            />
          )}
          {videoLoaded && (
            <VideoControls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              formatTime={formatTime}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default BlobTracker;
