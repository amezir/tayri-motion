export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const videoAudioMap = new WeakMap();
const SOURCE_KEY = Symbol('blobTrackingAudio');

const getAudioContextForVideo = (video) => {
  if (!video) throw new Error('No video element provided');

  const existing = video[SOURCE_KEY] || videoAudioMap.get(video);
  if (existing) {
    return existing;
  }

  try {
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(video);
    const entry = { audioContext, sourceNode, connectedToOutput: false };
    videoAudioMap.set(video, entry);
    video[SOURCE_KEY] = entry;
    return entry;
  } catch (err) {
    const fallback = videoAudioMap.get(video) || video[SOURCE_KEY];
    if (fallback) {
      return fallback;
    }
    throw err;
  }
};

const ensureOutputConnection = (entry) => {
  if (!entry) return;
  const { sourceNode, audioContext, connectedToOutput } = entry;
  if (!connectedToOutput) {
    try {
      sourceNode.connect(audioContext.destination);
      entry.connectedToOutput = true;
    } catch (e) {}
  }
};

const disconnectOutput = (entry) => {
  if (!entry) return;
  const { sourceNode, audioContext, connectedToOutput } = entry;
  if (connectedToOutput) {
    try {
      sourceNode.disconnect(audioContext.destination);
    } catch (e) {}
    entry.connectedToOutput = false;
  }
};

const reconnectOutput = (entry) => {
  if (!entry) return;
  try {
    entry.sourceNode?.connect(entry.audioContext.destination);
    entry.connectedToOutput = true;
  } catch (e) {}
};

export const exportVideo = async (
  video,
  canvas,
  params,
  callbacks = {},
  abortSignal,
  preferredFormat = "webm"
) => {
  const {
    onProgress = () => {},
    onStatus = () => {},
    onTimeRemaining = () => {},
    onComplete = () => {},
    onCanceled = () => {},
    onError = () => {},
  } = callbacks;

  let audioContext = null;
  let sourceNode = null;
  let destinationNode = null;
  let audioEntry = null;
  let canceled = false;

  try {
    onStatus('Capturing video...');

    const fps = params.exportFPS;
    const videoStream = canvas.captureStream(fps);
    const videoTrack = videoStream.getVideoTracks()[0];
    
    audioEntry = getAudioContextForVideo(video);
    ({ audioContext, sourceNode } = audioEntry);
    ensureOutputConnection(audioEntry);
    disconnectOutput(audioEntry);
    await audioContext.resume();

    destinationNode = audioContext.createMediaStreamDestination();
    sourceNode.connect(destinationNode);
    const combinedStream = new MediaStream([
      videoTrack,
      ...destinationNode.stream.getAudioTracks()
    ]);
    
    const mimeCandidates = [];

    if (preferredFormat === "mp4") {
      mimeCandidates.push(
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4"
      );
    }

    mimeCandidates.push(
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    );

    let mimeType = mimeCandidates.find((type) =>
      typeof MediaRecorder !== "undefined" &&
      typeof MediaRecorder.isTypeSupported === "function"
        ? MediaRecorder.isTypeSupported(type)
        : true
    );

    if (!mimeType) {
      mimeType = mimeCandidates[mimeCandidates.length - 1];
    }

    const fileExtension = mimeType.includes("mp4") ? "mp4" : "webm";
    
    const videoBitrate = params.videoBitrate * 1000;
    const audioBitrate = params.audioBitrate * 1000;
    
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

    const handleAbort = () => {
      canceled = true;
      try {
        mediaRecorder.stop();
      } catch (e) {}
      try {
        video.pause();
      } catch (e) {}
      onStatus('Export canceled');
    };

    const removeAbortListener = () => {
      try {
        abortSignal?.removeEventListener('abort', handleAbort);
      } catch (e) {}
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        handleAbort();
      } else {
        abortSignal.addEventListener('abort', handleAbort, { once: true });
      }
    }

    const wasPlaying = !video.paused;
    const originalTime = video.currentTime;
    const duration = video.duration;
    const wasMuted = video.muted;

    video.loop = false;
    video.currentTime = 0;
    video.muted = false;
    
    await Promise.resolve(video.play()).catch((err) => {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
        return;
      }
      throw err;
    });
    mediaRecorder.start();

    const startTime = Date.now();

    const updateProgress = () => {
      const currentTime = video.currentTime;
      const progress = (currentTime / duration) * 100;
      onProgress(progress);

      const elapsed = (Date.now() - startTime) / 1000;
      const estimatedTotal = currentTime > 0 ? (elapsed / currentTime) * duration : duration;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      onTimeRemaining(remaining);

      if (currentTime >= duration - 0.1 || canceled) {
        mediaRecorder.stop();
        return;
      }

      if (!video.paused && !video.ended) {
        requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();

    video.onended = () => {
      mediaRecorder.stop();
    };

    const recordedChunks = await recordingPromise;
    removeAbortListener();

    if (canceled) {
      try {
        if (sourceNode && destinationNode) {
          sourceNode.disconnect(destinationNode);
        }
      } catch (e) {}

      reconnectOutput(audioEntry);

      video.loop = true;
      video.currentTime = originalTime;
      video.muted = wasMuted;
      if (wasPlaying) {
        video.play().catch(() => {});
      }

      onCanceled();
      return;
    }

    onStatus('Finalisation...');
    onProgress(95);

    try {
      if (sourceNode && destinationNode) {
        sourceNode.disconnect(destinationNode);
      }
    } catch (e) {}

    reconnectOutput(audioEntry);

    const blob = new Blob(recordedChunks, { type: mimeType });
    const sizeInMB = (blob.size / (1024 * 1024)).toFixed(1);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tayri-garden-${Date.now()}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    video.loop = true;
    video.currentTime = originalTime;
    video.muted = wasMuted;
    if (wasPlaying) {
      video.play().catch(() => {});
    }
    
    onProgress(100);
    onStatus(`Export complete ! (${sizeInMB} MB)`);
    onComplete();

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    onError(error);
    try {
      removeAbortListener?.();
    } catch (e) {}
    try {
      if (sourceNode && destinationNode) {
        sourceNode.disconnect(destinationNode);
      }
    } catch (e) {}
    reconnectOutput(audioEntry);
    
    if (video) {
      video.loop = true;
    }
  }
};