import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import styles from '../styles/trancking.module.css';

const BlobTracker = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const paneRef = useRef(null);
  const [blobs, setBlobs] = useState([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTimeRemaining, setExportTimeRemaining] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const ffmpegRef = useRef(null);

  // Paramètres de tracking
  const params = useRef({
    threshold: 128,
    minBlobSize: 100,
    maxBlobs: 10,
    showBlobs: true,
    showOriginal: false,
    strokeStyle: '#ff0000ff',
    fillStyle: '#ffffffff',
    videoBitrate: 5000, // kbps
    audioBitrate: 128, // kbps
    exportFPS: 30,
  });

  const exportPresets = {
    low: { videoBitrate: 2000, audioBitrate: 96, exportFPS: 25 },
    medium: { videoBitrate: 5000, audioBitrate: 128, exportFPS: 30 },
    high: { videoBitrate: 10000, audioBitrate: 192, exportFPS: 30 }
  };

  const loadFFmpeg = useCallback(async () => {
    // Simplified version - just export as WebM with MP4-like quality
    return null;
  }, []);

  const handleExportVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoLoaded) {
      alert('Veuillez d\'abord charger une vidéo');
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportStatus('Capture de la vidéo...');

    try {
      // Capturer le flux vidéo du canvas avec le FPS configuré
      const fps = params.current.exportFPS;
      const videoStream = canvas.captureStream(fps);
      const videoTrack = videoStream.getVideoTracks()[0];
      
      // Créer un contexte audio pour capturer l'audio de la vidéo
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaElementSource(video);
      const destinationNode = audioContext.createMediaStreamDestination();
      sourceNode.connect(destinationNode);
      sourceNode.connect(audioContext.destination); // Pour continuer à entendre l'audio
      
      // Combiner les flux vidéo et audio
      const combinedStream = new MediaStream([
        videoTrack,
        ...destinationNode.stream.getAudioTracks()
      ]);
      
      // Utiliser le meilleur codec WebM disponible
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      // Récupérer les bitrates configurés
      const videoBitrate = params.current.videoBitrate * 1000; // Conversion en bps
      const audioBitrate = params.current.audioBitrate * 1000; // Conversion en bps
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: videoBitrate,
        audioBitsPerSecond: audioBitrate
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise((resolve) => {
        mediaRecorder.onstop = () => resolve(chunks);
      });

      // Sauvegarder l'état actuel de la vidéo
      const wasPlaying = !video.paused;
      const originalTime = video.currentTime;
      const duration = video.duration;
      const wasMuted = video.muted;

      // Désactiver le loop et recommencer depuis le début
      video.loop = false;
      video.currentTime = 0;
      video.muted = false; // Important : ne pas muter pour capturer l'audio
      
      await video.play();
      mediaRecorder.start();

      const startTime = Date.now();

      // Mise à jour de la progression
      const updateProgress = () => {
        const currentTime = video.currentTime;
        const progress = (currentTime / duration) * 100;
        setExportProgress(progress);

        const elapsed = (Date.now() - startTime) / 1000;
        const estimatedTotal = currentTime > 0 ? (elapsed / currentTime) * duration : duration;
        const remaining = Math.max(0, estimatedTotal - elapsed);
        setExportTimeRemaining(remaining);

        // Vérifier si on a atteint la fin
        if (currentTime >= duration - 0.1) {
          mediaRecorder.stop();
          return;
        }

        if (!video.paused && !video.ended) {
          requestAnimationFrame(updateProgress);
        }
      };

      updateProgress();

      // Arrêter l'enregistrement à la fin de la vidéo
      video.onended = () => {
        mediaRecorder.stop();
      };

      // Attendre que l'enregistrement soit terminé
      const recordedChunks = await recordingPromise;
      
      setExportStatus('Finalisation...');
      setExportProgress(95);

      // Nettoyer le contexte audio
      sourceNode.disconnect();
      audioContext.close();

      // Créer le blob WebM
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // Calculer la taille du fichier
      const sizeInMB = (blob.size / (1024 * 1024)).toFixed(1);
      console.log(`Taille du fichier exporté: ${sizeInMB} MB`);
      
      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blob-tracking-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Restaurer l'état de la vidéo
      video.loop = true;
      video.currentTime = originalTime;
      video.muted = wasMuted;
      if (wasPlaying) {
        video.play().catch(() => {});
      }
      
      setExportProgress(100);
      setExportStatus(`Export terminé ! (${sizeInMB} MB)`);
      
      setTimeout(() => {
        setExporting(false);
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export de la vidéo: ' + error.message);
      setExporting(false);
      
      // Restaurer la vidéo en cas d'erreur
      const video = videoRef.current;
      if (video) {
        video.loop = true;
      }
    }
  }, [videoLoaded, loadFFmpeg]);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    const width = 1280;
    const height = 720;
    renderer.setSize(width, height);

    sceneRef.current = { scene, camera, renderer };

    let mounted = true;

    if (typeof window !== 'undefined') {
      import('tweakpane')
        .then((mod) => {
          if (!mounted) return;

          const PaneCtor = mod?.Pane ?? mod?.default?.Pane ?? mod?.default ?? null;

          if (!PaneCtor) {
            console.warn('Tweakpane Pane constructor not found:', mod);
            return;
          }

          try {
            const pane = new PaneCtor({ title: 'Blob Tracking Controls', expanded: true });
            paneRef.current = pane;

            console.info('tweakpane module loaded', mod);
            console.info('created pane', pane);

            const addInput = (...args) => {
              if (typeof pane.addInput === 'function') return pane.addInput(...args);
              if (typeof pane.addBinding === 'function') return pane.addBinding(...args);
              console.warn('No addInput/addBinding available on Pane. Skipping control creation.');
              return null;
            };

            const addButton = (...args) => {
              if (typeof pane.addButton === 'function') return pane.addButton(...args);
              if (typeof pane.addBlade === 'function') return pane.addBlade({ view: 'button', ...(args[0] || {}) });
              console.warn('No addButton/addBlade available on Pane. Skipping button creation.');
              return { on: () => {} };
            };

            addInput(params.current, 'threshold', {
              min: 0,
              max: 255,
              step: 1,
              label: 'Threshold',
            });

            addInput(params.current, 'minBlobSize', {
              min: 10,
              max: 1000,
              step: 10,
              label: 'Min Size',
            });

            addInput(params.current, 'maxBlobs', {
              min: 1,
              max: 50,
              step: 1,
              label: 'Max Blobs',
            });

            addInput(params.current, 'strokeStyle', {
              label: 'Stroke Style',
              view: 'color',
            });

            addInput(params.current, 'fillStyle', {
              label: 'Fill Style',
              view: 'color',
            });

            addInput(params.current, 'showOriginal', { label: 'Show Original' });
            addInput(params.current, 'showBlobs', { label: 'Show Blobs' });

            // Séparateur pour les options d'export
            try {
              if (typeof pane.addBlade === 'function') {
                pane.addBlade({ view: 'separator' });
              }
            } catch (e) {}

            // Options d'export
            addInput(params.current, 'videoBitrate', {
              min: 1000,
              max: 20000,
              step: 500,
              label: 'Video Bitrate (kbps)',
            });

            addInput(params.current, 'audioBitrate', {
              min: 64,
              max: 320,
              step: 32,
              label: 'Audio Bitrate (kbps)',
            });

            addInput(params.current, 'exportFPS', {
              min: 15,
              max: 60,
              step: 5,
              label: 'Export FPS',
            });

            const playBtn = addButton({ title: 'Play' });
            try {
              playBtn.on?.('click', () => {
                const v = videoRef.current;
                if (v) {
                  try {
                    const p = v.play();
                    if (p && typeof p.then === 'function') p.catch(() => {});
                  } catch (err) {}
                }
              });
            } catch (e) {}

            const pauseBtn = addButton({ title: 'Pause' });
            try {
              pauseBtn.on?.('click', () => {
                const v = videoRef.current;
                if (v) v.pause();
              });
            } catch (e) {}

            const btn = addButton({ title: 'Import Video' });
            try {
              btn.on?.('click', () => {
                document.getElementById('videoInput')?.click();
              });
            } catch (e) {}

            // Bouton Export MP4
            const exportBtn = addButton({ title: 'Export MP4' });
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
    }

    return () => {
      mounted = false;
      renderer.dispose();
      if (paneRef.current) {
        try {
          paneRef.current.dispose();
        } catch (e) {}
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
                console.warn('Video play prevented by browser autoplay policy:', err);
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

    const processFrame = () => {
      if (video.paused || video.ended) {
        requestAnimationFrame(processFrame);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const binaryData = new Uint8Array(canvas.width * canvas.height);

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const idx = i / 4;
        binaryData[idx] = gray > params.current.threshold ? 255 : 0;
      }

      const detectedBlobs = detectBlobs(binaryData, canvas.width, canvas.height);
      setBlobs(detectedBlobs);

      if (!params.current.showOriginal) {
        for (let i = 0; i < binaryData.length; i++) {
          const val = binaryData[i];
          data[i * 4] = val;
          data[i * 4 + 1] = val;
          data[i * 4 + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      if (params.current.showBlobs) {
        ctx.strokeStyle = params.current.strokeStyle;
        ctx.lineWidth = 2;
        ctx.font = '14px monospace';
        ctx.fillStyle = params.current.fillStyle;

        detectedBlobs.forEach((blob) => {
          ctx.strokeRect(blob.x, blob.y, blob.width, blob.height);
          ctx.fillText(`x:${blob.centerX.toFixed(0)}, y:${blob.centerY.toFixed(0)}`, blob.x, blob.y - 5);
        });
      }

      requestAnimationFrame(processFrame);
    };

    processFrame();
  }, [videoLoaded]);

  const detectBlobs = (binaryData, width, height) => {
    const visited = new Uint8Array(width * height);
    const blobs = [];

    const floodFill = (startX, startY) => {
      const stack = [[startX, startY]];
      const pixels = [];
      let minX = startX,
        maxX = startX,
        minY = startY,
        maxY = startY;

      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = y * width + x;

        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (visited[idx] || binaryData[idx] === 0) continue;

        visited[idx] = 1;
        pixels.push([x, y]);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      return { pixels, minX, maxX, minY, maxY };
    };

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = y * width + x;
        if (binaryData[idx] === 255 && !visited[idx]) {
          const blob = floodFill(x, y);

          if (blob.pixels.length >= params.current.minBlobSize) {
            const centerX = (blob.minX + blob.maxX) / 2;
            const centerY = (blob.minY + blob.maxY) / 2;

            blobs.push({
              x: blob.minX,
              y: blob.minY,
              width: blob.maxX - blob.minX,
              height: blob.maxY - blob.minY,
              centerX,
              centerY,
              size: blob.pixels.length,
            });
          }
        }
      }
    }

    return blobs.sort((a, b) => b.size - a.size).slice(0, params.current.maxBlobs);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <video 
          ref={videoRef} 
          className={styles.video}
          loop 
          playsInline 
        />
        
        <canvas 
          ref={canvasRef} 
          className={styles.canvas}
        />

        {!videoLoaded && (
          <div className={styles.importOverlay}>
            <button
              onClick={() => document.getElementById('videoInput')?.click()}
              className={styles.importButton}
            >
              Import Video
            </button>
          </div>
        )}

        {exporting && (
          <div className={styles.exportOverlay}>
            <div className={styles.exportStatus}>
              {exportStatus}
            </div>
            
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
              Temps restant: {formatTime(exportTimeRemaining)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlobTracker;