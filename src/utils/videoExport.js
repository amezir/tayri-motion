export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const exportVideo = async (video, canvas, params, callbacks) => {
  const { onProgress, onStatus, onTimeRemaining, onComplete, onError } = callbacks;

  try {
    onStatus('Capture de la vidéo...');

    const fps = params.exportFPS;
    const videoStream = canvas.captureStream(fps);
    const videoTrack = videoStream.getVideoTracks()[0];
    
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(video);
    const destinationNode = audioContext.createMediaStreamDestination();
    sourceNode.connect(destinationNode);
    sourceNode.connect(audioContext.destination);
    
    const combinedStream = new MediaStream([
      videoTrack,
      ...destinationNode.stream.getAudioTracks()
    ]);
    
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    
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

    const wasPlaying = !video.paused;
    const originalTime = video.currentTime;
    const duration = video.duration;
    const wasMuted = video.muted;

    video.loop = false;
    video.currentTime = 0;
    video.muted = false;
    
    await video.play();
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

      if (currentTime >= duration - 0.1) {
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
    
    onStatus('Finalisation...');
    onProgress(95);

    sourceNode.disconnect();
    audioContext.close();

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const sizeInMB = (blob.size / (1024 * 1024)).toFixed(1);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blob-tracking-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    
    video.loop = true;
    video.currentTime = originalTime;
    video.muted = wasMuted;
    if (wasPlaying) {
      video.play().catch(() => {});
    }
    
    onProgress(100);
    onStatus(`Export terminé ! (${sizeInMB} MB)`);
    onComplete();

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    onError(error);
    
    if (video) {
      video.loop = true;
    }
  }
};