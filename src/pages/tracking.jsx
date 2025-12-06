import React, { useEffect, useRef, useState } from 'react';
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

  // Paramètres de tracking
  const params = useRef({
    threshold: 128,
    minBlobSize: 100,
    maxBlobs: 10,
    blur: 1,
    showOriginal: false,
    sensitivity: 1.0,
    strokeStyle: '#ff0000ff',
    fillStyle: '#ff0000ff',
  });

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
            // eslint-disable-next-line no-console
            console.warn('Tweakpane Pane constructor not found:', mod);
            return;
          }

          try {
            const pane = new PaneCtor({ title: 'Blob Tracking Controls', expanded: true });
            paneRef.current = pane;

            // eslint-disable-next-line no-console
            console.info('tweakpane module loaded', mod);
            // eslint-disable-next-line no-console
            console.info('created pane', pane);

            const addInput = (...args) => {
              if (typeof pane.addInput === 'function') return pane.addInput(...args);
              if (typeof pane.addBinding === 'function') return pane.addBinding(...args);
              // eslint-disable-next-line no-console
              console.warn('No addInput/addBinding available on Pane. Skipping control creation.');
              return null;
            };

            const addButton = (...args) => {
              if (typeof pane.addButton === 'function') return pane.addButton(...args);
              if (typeof pane.addBlade === 'function') return pane.addBlade({ view: 'button', ...(args[0] || {}) });
              // eslint-disable-next-line no-console
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

            addInput(params.current, 'blur', {
              min: 0,
              max: 10,
              step: 0.1,
              label: 'Blur',
            });

            addInput(params.current, 'sensitivity', {
              min: 0.1,
              max: 3,
              step: 0.1,
              label: 'Sensitivity',
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

            const btn = addButton({ title: 'Import Video' });
            try {
              btn.on?.('click', () => {
                document.getElementById('videoInput')?.click();
              });
            } catch (e) {
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to initialize Tweakpane', err);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load tweakpane module', err);
        });
    }

    return () => {
      mounted = false;
      renderer.dispose();
      if (paneRef.current) {
        try {
          paneRef.current.dispose();
        } catch (e) {
        }
      }
    };
  }, []);

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const video = videoRef.current;
      if (video) {
        video.src = url;
        video.load();
        video.play();
        setVideoLoaded(true);
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
      if (video.paused || video.ended) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Conversion en niveaux de gris et seuillage
      const binaryData = new Uint8Array(canvas.width * canvas.height);

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const idx = i / 4;
        binaryData[idx] = gray > params.current.threshold ? 255 : 0;
      }

      // Détection des blobs (algorithme simple de connected components)
      const detectedBlobs = detectBlobs(binaryData, canvas.width, canvas.height);
      setBlobs(detectedBlobs);

      // Visualisation
      if (!params.current.showOriginal) {
        for (let i = 0; i < binaryData.length; i++) {
          const val = binaryData[i];
          data[i * 4] = val;
          data[i * 4 + 1] = val;
          data[i * 4 + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Dessiner les bounding boxes
      ctx.strokeStyle = params.current.strokeStyle;
      ctx.lineWidth = 2;
      ctx.font = '14px monospace';
      ctx.fillStyle = params.current.fillStyle;

      detectedBlobs.forEach((blob) => {
        ctx.strokeRect(blob.x, blob.y, blob.width, blob.height);
        ctx.fillText(`x:${blob.centerX.toFixed(0)}, y:${blob.centerY.toFixed(0)}`, blob.x, blob.y - 5);
      });

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

  return (
    <div className={styles.page}>
      <input id="videoInput" type="file" accept="video/*" onChange={handleVideoUpload} className={styles.hidden} />

      <div ref={containerRef} className={styles.container}>
        <video ref={videoRef} className={styles.hidden} loop playsInline />

        <canvas ref={canvasRef} className={styles.canvas} style={{ imageRendering: 'crisp-edges' }} />

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
      </div>

      {/* {videoLoaded && (
        <div className={styles.statusPanel}>
          <div>Blobs détectés: {blobs.length}</div>
          <div>Max blobs: {params.current.maxBlobs}</div>
          <div>Threshold: {params.current.threshold}</div>
        </div>
      )} */}
    </div>
  );
};

export default BlobTracker;