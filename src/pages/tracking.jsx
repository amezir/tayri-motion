import React, { useEffect, useRef, useState, useCallback } from 'react';
import { processVideoFrame } from '../utils/videoProcessing';
import { exportVideo, formatTime } from '../utils/videoExport';
import styles from '../styles/trancking.module.scss';

const BlobTracker = () => {
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

  const params = useRef({
    threshold: 128,
    minBlobSize: 100,
    maxBlobs: 10,
    showBlobs: true,
    showOriginal: false,
    strokeStyle: '#ff0000ff',
    fillStyle: '#ffffffff',
    videoBitrate: 5000,
    audioBitrate: 128,
    exportFPS: 30,
    showConnections: false,
    connectionStyle: 'normal',
    connectionCurvature: 0,
    connectionColor: '#00ff00ff',
    connectionWidth: 2,
    connectionFromEdge: true,
    dashLength: 10,
    dashGap: 5,
  });

  const handleExportVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !videoLoaded) {
      alert("Veuillez d'abord charger une vidéo");
      return;
    }

    setExporting(true);
    setExportProgress(0);

    await exportVideo(video, canvas, params.current, {
      onProgress: setExportProgress,
      onStatus: setExportStatus,
      onTimeRemaining: setExportTimeRemaining,
      onComplete: () => {
        setTimeout(() => setExporting(false), 2000);
      },
      onError: (error) => {
        alert("Erreur lors de l'export de la vidéo: " + (error?.message || String(error)));
        setExporting(false);
      },
    });
  }, [videoLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let paneInstance = null;

    import('tweakpane')
      .then((mod) => {
        // Récupération du constructeur Pane quelle que soit la version exportée
        const PaneCtor = mod?.Pane ?? mod?.default?.Pane ?? mod?.default ?? null;
        if (!PaneCtor) {
          console.warn('Tweakpane module loaded but Pane constructor not found.');
          return;
        }

        try {
          paneInstance = new PaneCtor({ title: 'Blob Tracking Controls', expanded: true });
          paneRef.current = paneInstance;

          // Helper universel pour ajouter un input à un "container" (pane ou folder)
          const addInputTo = (parent, targetObj, key, options = {}) => {
            // Si parent a addInput -> use it
            if (parent && typeof parent.addInput === 'function') {
              try {
                return parent.addInput(targetObj, key, options);
              } catch (e) {
                // fallback to other methods below
              }
            }

            // Some older/newer versions may use addBinding
            if (parent && typeof parent.addBinding === 'function') {
              try {
                return parent.addBinding(targetObj, key, options);
              } catch (e) {}
            }

            // If there's no suitable method on parent, fallback to root pane
            if (paneInstance && typeof paneInstance.addInput === 'function') {
              try {
                return paneInstance.addInput(targetObj, key, options);
              } catch (e) {}
            }

            // Last resort: try to create a blade (best-effort)
            if (paneInstance && typeof paneInstance.addBlade === 'function') {
              try {
                // build a generic blade for booleans / numbers / strings / color
                const view = options.view
                  ? options.view
                  : typeof targetObj[key] === 'boolean'
                  ? 'checkbox'
                  : typeof targetObj[key] === 'number'
                  ? 'number'
                  : 'text';

                const bladeCfg = { view, label: options.label ?? key };
                // For color, some versions expect { view: 'color' } and a params object
                if (view === 'color') {
                  return paneInstance.addBlade({
                    view: 'color',
                    label: options.label ?? key,
                    params: { value: targetObj[key] },
                  });
                }

                // generic text/number/checkbox blade
                return paneInstance.addBlade({
                  view: view === 'checkbox' ? 'boolean' : 'input',
                  label: options.label ?? key,
                  params: { value: targetObj[key] },
                });
              } catch (e) {
                // nothing else we can do
              }
            }

            // nothing added
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

            // no-op fallback
            return { on: () => {} };
          };

          // Create folder helper that returns either the folder or null
          const createFolder = (title, expanded = false) => {
            try {
              const folder = paneInstance.addFolder?.({ title, expanded });
              if (folder) return folder;
            } catch (e) {}
            // If addFolder not available, try addBlade('folder') (some variations)
            try {
              const blade = paneInstance.addBlade?.({ view: 'folder', title, expanded });
              if (blade) return blade;
            } catch (e) {}
            // fallback: return null so addInputTo will attach to root pane
            return null;
          };

          //
          // Build folders + inputs (utilise addInputTo et addButtonTo pour compatibilité)
          //

          // Blob Detection folder
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

          // Colors folder
          const colorsFolder = createFolder('Blob Colors', false);
          addInputTo(colorsFolder ?? paneInstance, params.current, 'strokeStyle', { label: 'Stroke Style', view: 'color' });
          addInputTo(colorsFolder ?? paneInstance, params.current, 'fillStyle', { label: 'Fill Style', view: 'color' });

          // Connections folder
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

          // Export folder
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

          // Actions folder (buttons)
          const actionsFolder = createFolder('Actions', true);
          const playBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Play' });
          try {
            playBtn.on?.('click', () => videoRef.current?.play());
          } catch (e) {}

          const pauseBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Pause' });
          try {
            pauseBtn.on?.('click', () => videoRef.current?.pause());
          } catch (e) {}

          const importBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Import Video' });
          try {
            importBtn.on?.('click', () => document.getElementById('videoInput')?.click());
          } catch (e) {}

          const exportBtn = addButtonTo(actionsFolder ?? paneInstance, { title: 'Export MP4' });
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
          setVideoLoaded(true);
          try {
            const playPromise = video.play();
            if (playPromise !== undefined && typeof playPromise.then === 'function') {
              playPromise.catch((err) => {
                try {
                  video.muted = true;
                  video.play().catch(() => {});
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

    video.addEventListener('play', processFrame);

    video.addEventListener('pause', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });

    if (!video.paused) {
      processFrame();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      video.removeEventListener('play', processFrame);
    };
  }, [videoLoaded]);

  return (
    <div className={styles.page}>
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

        {!videoLoaded && (
          <div className={styles.importOverlay}>
            <button onClick={() => document.getElementById('videoInput')?.click()} className={styles.importButton}>
              Import Video
            </button>
          </div>
        )}

        {exporting && (
          <div className={styles.exportOverlay}>
            <div className={styles.exportStatus}>{exportStatus}</div>

            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${exportProgress}%` }} />
            </div>

            <div className={styles.progressPercent}>{exportProgress.toFixed(1)}%</div>

            <div className={styles.timeRemaining}>Temps restant: {formatTime(exportTimeRemaining)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlobTracker;
