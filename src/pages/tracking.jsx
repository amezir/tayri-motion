import React, { useEffect, useRef, useState, useCallback } from 'react';
import { processVideoFrame } from '../utils/videoProcessing';
import { exportVideo, formatTime } from '../utils/videoExport';
import styles from '../styles/trancking.module.scss';
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";

const BlobTracker = () => {
  const { isAltTheme, setIsAltTheme } = useTheme();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const paneRef = useRef(null);
  const [blobs, setBlobs] = useState([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTimeRemaining, setExportTimeRemaining] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const exportAbortControllerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const params = useRef({
    threshold: 128,
    minBlobSize: 100,
    maxBlobs: 10,
    showBlobs: true,
    showOriginal: true,
    strokeStyle: '#ff0000ff',
    fillStyle: '#ffffffff',
    videoBitrate: 5000,
    audioBitrate: 128,
    exportFPS: 30,
    showConnections: false,
    connectionStyle: 'normal',
    connectionCurvature: 0,
    connectionColor: '#ffffffff',
    connectionWidth: 2,
    connectionFromEdge: true,
    dashLength: 10,
    dashGap: 5,
  });

  const handleExportVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !videoLoaded) {
      alert("Please load a video first");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing export...');

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
          setExportStatus('Export canceled');
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
          alert("Error while exporting the video: " + (error?.message || String(error)));
          setExporting(false);
        },
      },
      abortController.signal,
    );
  }, [videoLoaded]);

  const handleCancelExport = useCallback(() => {
    if (exportAbortControllerRef.current) {
      setExportStatus('Cancelling export...');
      exportAbortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let paneInstance = null;

    import('tweakpane')
      .then((mod) => {
        const PaneCtor = mod?.Pane ?? mod?.default?.Pane ?? mod?.default ?? null;
        if (!PaneCtor) {
          console.warn('Tweakpane module loaded but Pane constructor not found.');
          return;
        }

        try {
          paneInstance = new PaneCtor({ title: 'Blob Tracking Controls', expanded: true });
          paneRef.current = paneInstance;

          const addInputTo = (parent, targetObj, key, options = {}) => {
            if (parent && typeof parent.addInput === 'function') {
              try {
                return parent.addInput(targetObj, key, options);
              } catch (e) {
              }
            }

            if (parent && typeof parent.addBinding === 'function') {
              try {
                return parent.addBinding(targetObj, key, options);
              } catch (e) {}
            }

            if (paneInstance && typeof paneInstance.addInput === 'function') {
              try {
                return paneInstance.addInput(targetObj, key, options);
              } catch (e) {}
            }

            if (paneInstance && typeof paneInstance.addBlade === 'function') {
              try {
                const view = options.view
                  ? options.view
                  : typeof targetObj[key] === 'boolean'
                  ? 'checkbox'
                  : typeof targetObj[key] === 'number'
                  ? 'number'
                  : 'text';

                const bladeCfg = { view, label: options.label ?? key };
                if (view === 'color') {
                  return paneInstance.addBlade({
                    view: 'color',
                    label: options.label ?? key,
                    params: { value: targetObj[key] },
                  });
                }

                return paneInstance.addBlade({
                  view: view === 'checkbox' ? 'boolean' : 'input',
                  label: options.label ?? key,
                  params: { value: targetObj[key] },
                });
              } catch (e) {
              }
            }

            return null;
          };

          const addButtonTo = (parent, cfg) => {
            if (parent && typeof parent.addButton === 'function') {
              try {
                return parent.addButton(cfg);
              } catch (e) {}
            }

            if (parent && typeof parent.addBlade === 'function') {
              try {
                return parent.addBlade({ view: 'button', ...cfg });
              } catch (e) {}
            }

            if (paneInstance && typeof paneInstance.addButton === 'function') {
              try {
                return paneInstance.addButton(cfg);
              } catch (e) {}
            }

            if (paneInstance && typeof paneInstance.addBlade === 'function') {
              try {
                return paneInstance.addBlade({ view: 'button', ...cfg });
              } catch (e) {}
            }

            return { on: () => {} };
          };

          const createFolder = (title, expanded = false) => {
            try {
              const folder = paneInstance.addFolder?.({ title, expanded });
              if (folder) return folder;
            } catch (e) {}
            try {
              const blade = paneInstance.addBlade?.({ view: 'folder', title, expanded });
              if (blade) return blade;
            } catch (e) {}
            return null;
          };

          const blobFolder = createFolder('Blob Detection', true);
          addInputTo(blobFolder ?? paneInstance, params.current, 'threshold', {
            min: 0,
            max: 255,
            step: 1,
            label: 'Threshold',
          });
          addInputTo(blobFolder ?? paneInstance, params.current, 'minBlobSize', {
            min: 10,
            max: 1000,
            step: 10,
            label: 'Min Size',
          });
          addInputTo(blobFolder ?? paneInstance, params.current, 'maxBlobs', {
            min: 1,
            max: 50,
            step: 1,
            label: 'Max Blobs',
          });
          addInputTo(blobFolder ?? paneInstance, params.current, 'showBlobs', { label: 'Show Blobs' });
          addInputTo(blobFolder ?? paneInstance, params.current, 'showOriginal', { label: 'Show Original' });

          const colorsFolder = createFolder('Blob Colors', false);
          addInputTo(colorsFolder ?? paneInstance, params.current, 'strokeStyle', { label: 'Stroke Style', view: 'color' });
          addInputTo(colorsFolder ?? paneInstance, params.current, 'fillStyle', { label: 'Fill Style', view: 'color' });

          const connectionsFolder = createFolder('Connections (Beta)', false);
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'showConnections', { label: 'Show Connections' });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'connectionStyle', {
            label: 'Style',
            options: { Normal: 'normal', Dashed: 'dashed', Arrow: 'arrow' },
          });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'connectionCurvature', {
            min: 0,
            max: 200,
            step: 5,
            label: 'Curvature',
          });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'connectionColor', { label: 'Color', view: 'color' });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'connectionWidth', {
            min: 1,
            max: 10,
            step: 0.5,
            label: 'Width',
          });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'dashLength', { min: 1, max: 50, step: 1, label: 'Dash Length' });
          addInputTo(connectionsFolder ?? paneInstance, params.current, 'dashGap', { min: 1, max: 50, step: 1, label: 'Dash Gap' });

          const exportFolder = createFolder('Export Settings', false);
          addInputTo(exportFolder ?? paneInstance, params.current, 'videoBitrate', {
            min: 1000,
            max: 20000,
            step: 500,
            label: 'Video Bitrate (kbps)',
          });
          addInputTo(exportFolder ?? paneInstance, params.current, 'audioBitrate', {
            min: 64,
            max: 320,
            step: 32,
            label: 'Audio Bitrate (kbps)',
          });
          addInputTo(exportFolder ?? paneInstance, params.current, 'exportFPS', {
            min: 15,
            max: 60,
            step: 5,
            label: 'Export FPS',
          });

          const actionsFolder = createFolder('Actions', true);

          const importBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Import Video' });
          try {
            importBtn.on?.('click', () => document.getElementById('videoInput')?.click());
          } catch (e) {}

          const exportBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Export WEBM' });
          try {
            exportBtn.on?.('click', handleExportVideo);
          } catch (e) {}
        } catch (err) {
          console.error('Failed to initialize Tweakpane', err);
        }
      })
      .catch((err) => {
        console.error('Failed to load tweakpane module', err);
      });

    return () => {
      if (paneRef.current) {
        try {
          paneRef.current.dispose();
        } catch (e) {}
        paneRef.current = null;
      }
    };
  }, [handleExportVideo]);

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
        video.src = url;
        video.load();

        const onLoaded = () => {
          const vw = video.videoWidth || 1280;
          const vh = video.videoHeight || 720;
          if (canvas) {
            canvas.width = vw;
            canvas.height = vh;
            canvas.style.width = `${vw}px`;
            canvas.style.height = `auto`;
          }
          setDuration(video.duration || 0);
          setVideoLoaded(true);
          try {
            const playPromise = video.play();
            if (playPromise !== undefined && typeof playPromise.then === 'function') {
              playPromise.then(() => {
                setIsPlaying(true);
              }).catch((err) => {
                try {
                  video.muted = true;
                  video.play().then(() => {
                    setIsPlaying(true);
                  }).catch(() => {});
                } catch (e) {}
              });
            }
          } catch (e) {}

          video.removeEventListener('loadedmetadata', onLoaded);
        };

        video.addEventListener('loadedmetadata', onLoaded);
      }
    }
  };

  useEffect(() => {
    if (!videoLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth || 1280;
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

    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    if (!video.paused) {
      processFrame();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [videoLoaded]);

  return (
    <>
      <SEO title="Blob Tracking - Tayri Garden" description="Track and visualize blobs in your videos with ease." />
      <section className={`${styles.containerTracking} ${isAltTheme ? styles.containerTrackingAlt : ""}`}>
      <div className={`${styles.page} ${isAltTheme ? styles.pageAlt : ""}`}>
        <input
          id="videoInput"
          type="file"
          accept="video/*"
        onChange={handleVideoUpload}
        className={styles.videoInput}
      />

      <div ref={containerRef} className={styles.container}>
        <video ref={videoRef} className={styles.video} loop playsInline />

        <canvas ref={canvasRef} className={styles.canvas} />
        {videoLoaded && (
          <div className={styles.videoControls}>
            <button onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              step="0.1"
              className={styles.videoSeeker}
            />
            <div className={styles.videoTime}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className={styles.volumeControl}>
              <span className={styles.volumeIcon}>
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>
          </div>
        )}
        {!videoLoaded && (
          <div className={`${styles.importOverlay} ${isAltTheme ? styles.importOverlayAlt : ""}`}>
            <div className={styles.infoUse}>
                ️<p className={styles.useTitle}>How to use</p>
                <ul className={styles.useList}>
                  <li>01. Upload file</li>
                  <li>02. Edit</li>
                  <li>03. Download</li>
                </ul>
              </div>
            <button onClick={() => document.getElementById('videoInput')?.click()} className={`${styles.importButton} ${isAltTheme ? styles.importButtonAlt : ""}`}>
              Import Video
            </button>
            <button
              type="button"
              className={`${styles.toggleThemeBtn} ${isAltTheme ? styles.toggleThemeBtnAlt : ""}`}
              onClick={() => setIsAltTheme((prev) => !prev)}
            >
              {isAltTheme ? "🌙" : "☀️"}
            </button>
          </div>
        )}

        {exporting && (
          <div className={styles.exportOverlay}>
            <img src="./logo.png" alt="logo" draggable="false" />
            <div className={styles.exportStatus}>{exportStatus}</div>

            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${exportProgress}%` }} />
            </div>

            <div className={styles.progressPercent}>{exportProgress.toFixed(1)}%</div>

            <div className={styles.timeRemaining}>Time remaining: {formatTime(exportTimeRemaining)}</div>

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
    </div>
    <div className={styles.pannelContainer}>
      <p>Blob count: {blobs.length}</p>
    </div>
    </section>
    </>
  );
};

export default BlobTracker;
