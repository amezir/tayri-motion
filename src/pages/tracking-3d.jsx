import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import clsx from "clsx";
import styles from "../styles/trancking.module.scss";
import SEO from "@/components/SEO";
import ControlPanel from "@/components/ControlPanel/ControlPanel";
import { useTheme } from "@/contexts/ThemeContext";
import { detectBlobs } from "../utils/blobDetection";
import { drawConnections } from "../utils/blobConnections";

const SUPPORTED = ".glb,.gltf,.obj,.stl,.fbx";
const FIT_SIZE = 4; // largest model dimension is normalized to this
const DETECT_WIDTH = 384; // downscaled resolution used for blob detection

const randomFrom = (length, charset) => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
};

const randomLabelForMode = (mode) => {
  switch (mode) {
    case "randomNumbers":
      return randomFrom(6, "0123456789");
    case "randomLetters":
      return randomFrom(6, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    case "randomSymbols":
      return randomFrom(6, "!@#$%^&*()[]{}<>?/|~-=+");
    default:
      return "?";
  }
};

const Tracking3D = () => {
  const { isAltTheme, setIsAltTheme } = useTheme();
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const detectCanvasRef = useRef(null);
  const recordCanvasRef = useRef(null);
  const recordingRef = useRef(false);
  const recorderRef = useRef(null);

  const three = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    grid: null,
    model: null,
    modelSize: null,
  });
  const wireframeRef = useRef(false);
  const trackingRef = useRef(true);
  const blobsRef = useRef([]);
  const labelCacheRef = useRef(new Map());
  const rotateSpeedRef = useRef(2);

  const params = useRef({
    threshold: 90,
    minBlobSize: 40,
    maxBlobs: 15,
    showBlobs: true,
    showOriginal: true,
    strokeStyle: "#dde000",
    fillStyle: "#ffffff",
    blobBorderWidth: 2,
    blobCornerBorder: true,
    blobCornerLength: 16,
    blobFillMode: "none",
    blobBlurAmount: 6,
    blobFillOpacity: 0.35,
    blobZoomLevel: 2,
    showBlobLabels: true,
    blobLabelSize: 13,
    blobLabelColor: "#ffffff",
    blobLabelFontFamily: "monospace",
    blobLabelMode: "coords",
    showConnections: false,
    connectionStyle: "normal",
    connectionCurvature: 0,
    connectionColor: "#dde000",
    connectionWidth: 2,
    connectionFromEdge: true,
    dashLength: 10,
    dashGap: 5,
    maxConnectionDistance: 200,
  });

  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelInfo, setModelInfo] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [tracking, setTracking] = useState(true);
  const [blobCount, setBlobCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(2);

  const frameCamera = useCallback((size) => {
    const { camera, controls } = three.current;
    if (!camera || !controls || !size) return;
    const maxDim = Math.max(size.x, size.y, size.z) || FIT_SIZE;
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.7;
    camera.position.set(dist * 0.7, size.y * 0.55 + maxDim * 0.3, dist * 0.9);
    controls.target.set(0, size.y / 2, 0);
    controls.update();
  }, []);

  const applyWireframe = useCallback((on) => {
    const model = three.current.model;
    if (!model) return;
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if ("wireframe" in m) m.wireframe = on;
        });
      }
    });
  }, []);

  const disposeObject = useCallback((obj) => {
    obj.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m?.dispose?.());
      }
    });
  }, []);

  const addModelToScene = useCallback(
    (object) => {
      const { scene } = three.current;
      if (!scene) return;

      if (three.current.model) {
        scene.remove(three.current.model);
        disposeObject(three.current.model);
        three.current.model = null;
      }

      scene.add(object);

      let box = new THREE.Box3().setFromObject(object);
      let size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      object.scale.multiplyScalar(FIT_SIZE / maxDim);

      box = new THREE.Box3().setFromObject(object);
      size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.x -= center.x;
      object.position.z -= center.z;
      object.position.y -= box.min.y;

      three.current.model = object;
      three.current.modelSize = size;

      applyWireframe(wireframeRef.current);
      frameCamera(size);

      let meshes = 0;
      let vertices = 0;
      object.traverse((o) => {
        if (o.isMesh) {
          meshes += 1;
          const pos = o.geometry?.attributes?.position;
          if (pos) vertices += pos.count;
        }
      });
      setModelInfo({ meshes, vertices });
    },
    [applyWireframe, disposeObject, frameCamera],
  );

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      const url = URL.createObjectURL(file);
      setError("");
      setLoading(true);

      const done = (object) => {
        try {
          addModelToScene(object);
          setModelLoaded(true);
        } catch (e) {
          setError("Could not process this model.");
        } finally {
          setLoading(false);
          URL.revokeObjectURL(url);
        }
      };

      const fail = (e) => {
        console.error("Model load error:", e);
        setError(`Failed to load "${file.name}".`);
        setLoading(false);
        URL.revokeObjectURL(url);
      };

      try {
        if (ext === "glb" || ext === "gltf") {
          new GLTFLoader().load(
            url,
            (gltf) => done(gltf.scene),
            undefined,
            fail,
          );
        } else if (ext === "obj") {
          new OBJLoader().load(url, (obj) => done(obj), undefined, fail);
        } else if (ext === "fbx") {
          new FBXLoader().load(url, (obj) => done(obj), undefined, fail);
        } else if (ext === "stl") {
          new STLLoader().load(
            url,
            (geometry) => {
              geometry.computeVertexNormals();
              const mesh = new THREE.Mesh(
                geometry,
                new THREE.MeshStandardMaterial({
                  color: 0xcfd2d6,
                  metalness: 0.1,
                  roughness: 0.6,
                }),
              );
              done(mesh);
            },
            undefined,
            fail,
          );
        } else {
          setError("Unsupported format. Use GLB, GLTF, OBJ, STL or FBX.");
          setLoading(false);
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        fail(e);
      }
    },
    [addModelToScene],
  );

  const handleUpload = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleResetView = useCallback(() => {
    frameCamera(three.current.modelSize);
  }, [frameCamera]);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      if (three.current.controls) three.current.controls.autoRotate = next;
      return next;
    });
  }, []);

  const handleRotateSpeed = useCallback((e) => {
    const value = parseFloat(e.target.value);
    rotateSpeedRef.current = value;
    setRotateSpeed(value);
    if (three.current.controls) three.current.controls.autoRotateSpeed = value;
  }, []);

  const toggleWireframe = useCallback(() => {
    setWireframe((prev) => {
      const next = !prev;
      wireframeRef.current = next;
      applyWireframe(next);
      return next;
    });
  }, [applyWireframe]);

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => {
      const next = !prev;
      if (three.current.grid) three.current.grid.visible = next;
      return next;
    });
  }, []);

  const toggleTracking = useCallback(() => {
    setTracking((prev) => {
      const next = !prev;
      trackingRef.current = next;
      if (!next) {
        const overlay = overlayRef.current;
        overlay
          ?.getContext("2d")
          ?.clearRect(0, 0, overlay.width, overlay.height);
        setBlobCount(0);
      }
      return next;
    });
  }, []);

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    recordingRef.current = false;
    setRecording(false);
    if (rec?.recorder && rec.recorder.state !== "inactive") {
      try {
        rec.recorder.stop();
      } catch (e) {}
    }
    try {
      rec?.stream?.getTracks?.().forEach((t) => t.stop());
    } catch (e) {}
    recorderRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    const dom = three.current.renderer?.domElement;
    const rc = recordCanvasRef.current;
    if (!dom || !rc || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser.");
      return;
    }

    rc.width = dom.width;
    rc.height = dom.height;

    // Manual capture (captureStream(0) + requestFrame) keeps the recording in
    // sync with what is composited each frame.
    let stream = null;
    let track = null;
    let manual = false;
    try {
      stream = rc.captureStream(0);
      track = stream.getVideoTracks()[0];
      manual = typeof track?.requestFrame === "function";
    } catch (e) {
      stream = null;
    }
    if (!stream || !track || !manual) {
      stream = rc.captureStream(30);
      track = stream.getVideoTracks()[0];
      manual = false;
    }

    const candidates = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mime =
      candidates.find((t) =>
        typeof MediaRecorder.isTypeSupported === "function"
          ? MediaRecorder.isTypeSupported(t)
          : false,
      ) || "video/webm";
    const ext = mime.includes("mp4") ? "mp4" : "webm";

    let recorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8_000_000,
      });
    } catch (e) {
      setError("Recording is not supported in this browser.");
      return;
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tayri-3d-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const frameInterval = 1000 / 30;
    let lastFrameAt = -Infinity;
    const pushFrame = () => {
      if (!manual) return;
      const t = performance.now();
      if (t - lastFrameAt >= frameInterval - 1.5) {
        lastFrameAt = t;
        try {
          track.requestFrame();
        } catch (e) {}
      }
    };

    recorderRef.current = { recorder, stream, pushFrame };
    recordingRef.current = true;
    setError("");
    setRecording(true);
    recorder.start();
  }, []);

  const toggleRecording = useCallback(() => {
    if (recordingRef.current) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
    camera.position.set(4, 3, 6);

    // preserveDrawingBuffer lets us read the rendered frame back for tracking.
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    const dom = renderer.domElement;
    dom.style.width = "100%";
    dom.style.height = "100%";
    dom.style.display = "block";
    dom.style.touchAction = "none";
    mount.appendChild(dom);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(20, 20, 0x888888, 0x555555);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);

    const controls = new OrbitControls(camera, dom);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = rotateSpeedRef.current;
    controls.target.set(0, 1, 0);
    controls.update();

    three.current = {
      renderer,
      scene,
      camera,
      controls,
      grid,
      model: three.current.model,
      modelSize: three.current.modelSize,
    };

    const detectCanvas = detectCanvasRef.current;
    const detCtx = detectCanvas?.getContext("2d", { willReadFrequently: true });
    let lastCount = -1;

    // Detect bright, opaque regions of the rendered model and draw the tracking
    // overlay so the boxes follow the model as it rotates.
    const runTracking = () => {
      const overlay = overlayRef.current;
      if (!overlay || !detectCanvas || !detCtx || !three.current.model) return;

      const bw = dom.width;
      const bh = dom.height;
      if (!bw || !bh) return;

      const detW = DETECT_WIDTH;
      const detH = Math.max(2, Math.round((DETECT_WIDTH * bh) / bw));
      if (detectCanvas.width !== detW || detectCanvas.height !== detH) {
        detectCanvas.width = detW;
        detectCanvas.height = detH;
      }

      try {
        detCtx.clearRect(0, 0, detW, detH);
        detCtx.drawImage(dom, 0, 0, detW, detH);
      } catch (e) {
        return;
      }

      const data = detCtx.getImageData(0, 0, detW, detH).data;
      const binary = new Uint8Array(detW * detH);
      const th = params.current.threshold ?? 90;
      for (let i = 0; i < binary.length; i++) {
        const a = data[i * 4 + 3];
        // Ignore the transparent background and the semi-transparent grid.
        if (a < 128) {
          binary[i] = 0;
          continue;
        }
        const gray =
          data[i * 4] * 0.299 +
          data[i * 4 + 1] * 0.587 +
          data[i * 4 + 2] * 0.114;
        binary[i] = gray > th ? 255 : 0;
      }

      const blobs = detectBlobs(binary, detW, detH, params.current);
      blobsRef.current = blobs;

      const ow = mount.clientWidth;
      const oh = mount.clientHeight;
      if (overlay.width !== ow || overlay.height !== oh) {
        overlay.width = ow;
        overlay.height = oh;
      }
      const octx = overlay.getContext("2d");
      octx.clearRect(0, 0, ow, oh);

      const p = params.current;

      // "Show Original" OFF -> paint the binary detection mask over the model
      // (white = detected), mirroring the 2D tracker's binary view.
      if (p.showOriginal === false) {
        const mask = detCtx.createImageData(detW, detH);
        for (let i = 0; i < binary.length; i++) {
          const v = binary[i];
          mask.data[i * 4] = v;
          mask.data[i * 4 + 1] = v;
          mask.data[i * 4 + 2] = v;
          mask.data[i * 4 + 3] = 255;
        }
        detCtx.putImageData(mask, 0, 0);
        octx.imageSmoothingEnabled = false;
        octx.drawImage(detectCanvas, 0, 0, ow, oh);
        octx.imageSmoothingEnabled = true;
      }

      const sx = ow / detW;
      const sy = oh / detH;
      const stroke = p.strokeStyle || "#dde000";
      const borderWidth = p.blobBorderWidth ?? 2;

      const scaled = blobs.map((b) => ({
        x: b.x * sx,
        y: b.y * sy,
        width: b.width * sx,
        height: b.height * sy,
        centerX: b.centerX * sx,
        centerY: b.centerY * sy,
        size: b.size,
      }));

      // "Show Blobs" toggles the tracking overlay (fill / boxes / labels / connections).
      if (p.showBlobs !== false) {
        const fillMode = p.blobFillMode || "none";
        const fillOpacity = Math.min(Math.max(p.blobFillOpacity ?? 0.35, 0), 1);
        const blurAmount = Math.max(p.blobBlurAmount ?? 6, 0);
        const zoomLevel = Math.max(p.blobZoomLevel ?? 2, 1);
        const dw = dom.width;
        const dh = dom.height;

        const labelMode = p.blobLabelMode || "coords";
        const prevCache = labelCacheRef.current;
        const nextCache = new Map();

        octx.strokeStyle = stroke;
        octx.lineWidth = borderWidth;
        octx.font = `${p.blobLabelSize || 13}px ${
          p.blobLabelFontFamily || "monospace"
        }`;
        octx.textBaseline = "bottom";

        scaled.forEach((b) => {
          // --- Fill effects (Effect tab), sourced from the rendered model ---
          if ((fillMode === "blur" || fillMode === "both") && blurAmount > 0) {
            octx.save();
            octx.beginPath();
            octx.rect(b.x, b.y, b.width, b.height);
            octx.clip();
            octx.filter = `blur(${blurAmount}px)`;
            octx.drawImage(dom, 0, 0, ow, oh);
            octx.restore();
          }
          if (fillMode === "color" || fillMode === "both") {
            octx.save();
            octx.globalAlpha = fillOpacity;
            octx.fillStyle = p.fillStyle || "#ffffff";
            octx.fillRect(b.x, b.y, b.width, b.height);
            octx.restore();
          }
          if (fillMode === "zoom") {
            octx.save();
            octx.beginPath();
            octx.rect(b.x, b.y, b.width, b.height);
            octx.clip();
            const cx = (b.centerX / ow) * dw;
            const cy = (b.centerY / oh) * dh;
            const srcW = ((b.width / ow) * dw) / zoomLevel;
            const srcH = ((b.height / oh) * dh) / zoomLevel;
            const srcX = Math.max(0, Math.min(cx - srcW / 2, dw - srcW));
            const srcY = Math.max(0, Math.min(cy - srcH / 2, dh - srcH));
            octx.drawImage(
              dom,
              srcX,
              srcY,
              srcW,
              srcH,
              b.x,
              b.y,
              b.width,
              b.height,
            );
            octx.restore();
          }

          // --- Border ---
          if (borderWidth > 0) {
            if (p.blobCornerBorder) {
              const len = Math.min(
                p.blobCornerLength || 16,
                b.width / 2,
                b.height / 2,
              );
              const { x, y, width: w, height: h } = b;
              octx.beginPath();
              octx.moveTo(x, y + len);
              octx.lineTo(x, y);
              octx.lineTo(x + len, y);
              octx.moveTo(x + w - len, y);
              octx.lineTo(x + w, y);
              octx.lineTo(x + w, y + len);
              octx.moveTo(x, y + h - len);
              octx.lineTo(x, y + h);
              octx.lineTo(x + len, y + h);
              octx.moveTo(x + w - len, y + h);
              octx.lineTo(x + w, y + h);
              octx.lineTo(x + w, y + h - len);
              octx.stroke();
            } else {
              octx.strokeRect(b.x, b.y, b.width, b.height);
            }
          }

          // --- Label (honours Label Content mode, cached per position) ---
          if (p.showBlobLabels !== false) {
            let text;
            if (labelMode === "coords") {
              text = `x:${Math.round(b.centerX)} y:${Math.round(b.centerY)}`;
            } else {
              const key = `${Math.round(b.centerX / 24)}_${Math.round(
                b.centerY / 24,
              )}_${labelMode}`;
              text = prevCache.get(key) || randomLabelForMode(labelMode);
              nextCache.set(key, text);
            }
            octx.fillStyle = p.blobLabelColor || "#ffffff";
            octx.fillText(text, b.x, Math.max(b.y - 4, 12));
          }
        });

        labelCacheRef.current = nextCache;

        if (p.showConnections && scaled.length > 1) {
          drawConnections(octx, scaled, p);
        }
      }

      if (blobs.length !== lastCount) {
        lastCount = blobs.length;
        setBlobCount(blobs.length);
      }
    };

    // Composite the WebGL frame and the tracking overlay into one canvas so the
    // recording contains both the model and its tracking boxes.
    const compositeForRecording = () => {
      const rc = recordCanvasRef.current;
      const rec = recorderRef.current;
      if (!rc || !rec) return;
      const rctx = rc.getContext("2d");
      if (!rctx) return;
      rctx.fillStyle = "#0b0b0b";
      rctx.fillRect(0, 0, rc.width, rc.height);
      try {
        rctx.drawImage(dom, 0, 0, rc.width, rc.height);
      } catch (e) {}
      const ov = overlayRef.current;
      if (ov) {
        try {
          rctx.drawImage(ov, 0, 0, rc.width, rc.height);
        } catch (e) {}
      }
      rec.pushFrame();
    };

    let raf = null;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      if (trackingRef.current) runTracking();
      if (recordingRef.current) compositeForRecording();
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      recordingRef.current = false;
      if (recorderRef.current?.recorder?.state === "recording") {
        try {
          recorderRef.current.recorder.stop();
        } catch (e) {}
      }
      recorderRef.current = null;
      controls.dispose();
      if (three.current.model) {
        scene.remove(three.current.model);
        disposeObject(three.current.model);
      }
      grid.geometry.dispose();
      grid.material.dispose();
      pmrem.dispose();
      scene.environment?.dispose?.();
      renderer.dispose();
      if (dom.parentNode === mount) mount.removeChild(dom);
      three.current = {
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        grid: null,
        model: null,
        modelSize: null,
      };
    };
  }, [disposeObject]);

  const viewButton = (label, active, onClick, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "default" : "pointer",
        background: active ? "#dde000" : "transparent",
        color: active ? "#000" : isAltTheme ? "#000" : "#fff",
        border: `1px solid ${
          active ? "#dde000" : isAltTheme ? "#00000033" : "#ffffff33"
        }`,
        padding: "6px 10px",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <SEO
        title="3D Model Tracking - Tayri Motion"
        description="Import a 3D model and track its features live in an interactive WebGL scene."
      />
      <section
        className={clsx(
          styles.containerTracking,
          isAltTheme && styles.containerTrackingAlt,
        )}
      >
        <div className={styles.pannelContainer}>
          <ControlPanel
            paramsRef={params}
            enableExport
            enableImport={false}
            enableProfiles
            profileStorageKey="tayri-motion-profiles-3d"
            recordMode
            isRecording={recording}
            onToggleRecord={toggleRecording}
            onImport={() => document.getElementById("modelInput")?.click()}
          />
        </div>

        <div className={clsx(styles.page, isAltTheme && styles.pageAlt)}>
          <input
            id="modelInput"
            type="file"
            accept={SUPPORTED}
            onChange={handleUpload}
            className={styles.videoInput}
          />
          <div className={styles.header}>
            <p
              className={isAltTheme ? styles.authorTextAlt : styles.authorText}
            >
              made by{" "}
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
              <h1>Tayri Motion</h1>
            </Link>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                isAltTheme ? styles.toggleButtonAlt : ""
              }`}
              onClick={() => setIsAltTheme((prev) => !prev)}
            >
              {isAltTheme ? "dark " : "light"}
            </button>
          </div>

          <div className={styles.container}>
            <div
              ref={mountRef}
              style={{ width: "100%", height: "100%", position: "relative" }}
            />
            <canvas
              ref={overlayRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
            <canvas ref={detectCanvasRef} style={{ display: "none" }} />
            <canvas ref={recordCanvasRef} style={{ display: "none" }} />

            {modelLoaded && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                  zIndex: 20,
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  {recording && viewButton("● Rec", true, toggleRecording)}
                  {viewButton("Tracking", tracking, toggleTracking)}
                  {viewButton("Auto-rotate", autoRotate, toggleAutoRotate)}
                  {viewButton("Wireframe", wireframe, toggleWireframe)}
                  {viewButton("Grid", showGrid, toggleGrid)}
                  {viewButton("Reset view", false, handleResetView)}
                </div>
                {autoRotate && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: isAltTheme
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(0,0,0,0.6)",
                      border: `1px solid ${
                        isAltTheme ? "#00000022" : "#ffffff22"
                      }`,
                      color: isAltTheme ? "#000" : "#fff",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    <span>Speed</span>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.5"
                      value={rotateSpeed}
                      onChange={handleRotateSpeed}
                      style={{ width: 110, accentColor: "#dde000" }}
                      aria-label="Auto-rotate speed"
                    />
                    <span style={{ minWidth: 32, textAlign: "right" }}>
                      {rotateSpeed.toFixed(1)}×
                    </span>
                  </div>
                )}
              </div>
            )}

            {(modelLoaded || loading) && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 18,
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 16px",
                  background: isAltTheme
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(0,0,0,0.6)",
                  border: `1px solid ${isAltTheme ? "#00000022" : "#ffffff22"}`,
                  color: isAltTheme ? "#000" : "#fff",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  backdropFilter: "blur(6px)",
                  zIndex: 20,
                }}
              >
                {loading ? (
                  <span>Loading model…</span>
                ) : (
                  <>
                    {tracking && <span>{blobCount} tracked</span>}
                    {modelInfo && (
                      <span style={{ opacity: 0.7 }}>
                        {modelInfo.meshes} meshes
                      </span>
                    )}
                    <span style={{ opacity: 0.6 }}>
                      drag · scroll · right-drag
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {!modelLoaded && !loading && (
            <div
              className={clsx(
                styles.importOverlay,
                isAltTheme && styles.importOverlayAlt,
              )}
            >
              <div className={styles.infoUse}>
                <img src="./logo.png" alt="logo" draggable="false" />
                <p className={styles.useTitle}>3D Model Tracking</p>
                <ul className={styles.useList}>
                  <li>01. Import a model</li>
                  <li>02. Track live</li>
                  <li>03. Orbit & inspect</li>
                </ul>
              </div>
              <button
                onClick={() => document.getElementById("modelInput")?.click()}
                className={clsx(
                  styles.importButton,
                  isAltTheme && styles.importButtonAlt,
                )}
              >
                Import 3D Model
              </button>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  opacity: 0.6,
                  color: isAltTheme ? "#000" : "#fff",
                }}
              >
                GLB · GLTF · OBJ · STL · FBX
              </p>
              {error && (
                <p style={{ color: "#ff6b6b", fontFamily: "var(--font-mono)" }}>
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Tracking3D;
