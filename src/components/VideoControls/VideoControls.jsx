import React from "react";
import styles from "./VideoControls.module.scss";
import clsx from "clsx";
import { useTheme } from "@/contexts/ThemeContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const VolumeIcon = ({ volume, onClick, isAltTheme }) => {
  const variant = volume === 0 ? "mute" : volume < 0.5 ? "low" : "high";

  const handleKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(e);
      }
    },
    [onClick]
  );

  return (
    <svg
      className={clsx(styles.volumeIcon, isAltTheme && styles.volumeIconAlt)}
      viewBox="0 0 24 24"
      role="button"
      aria-label={volume === 0 ? "Unmute" : "Mute"}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <path d="M4 9.5h4l4-3v11l-4-3H4z" fill="currentColor" />
      {variant === "low" && (
        <path
          d="M15 10.5c1 1.8 1 3.2 0 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {variant === "high" && (
        <>
          <path
            d="M15 9c1.4 1.6 1.4 5.4 0 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M18 7c2.1 3.2 2.1 7.8 0 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {variant === "mute" && (
        <path
          d="M16 9l5 6m0-6l-5 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

const useFramePreviews = (videoRef, duration) => {
  const [previews, setPreviews] = React.useState([]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      if (!videoRef?.current || !duration) {
        setPreviews([]);
        return;
      }

      const videoEl = videoRef.current;
      const source = videoEl.currentSrc || videoEl.src;
      if (!source) {
        setPreviews([]);
        return;
      }

      const waitFor = (target, event, timeout = 4000) => {
        if (event === "loadedmetadata" && target.readyState >= 1) {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const onDone = () => {
            cleanup();
            resolve();
          };
          const onError = (err) => {
            cleanup();
            reject(err || new Error(`${event} failed`));
          };
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`${event} timeout`));
          }, timeout);
          const cleanup = () => {
            clearTimeout(timer);
            target.removeEventListener(event, onDone);
            target.removeEventListener("error", onError);
          };
          target.addEventListener(event, onDone, { once: true });
          target.addEventListener("error", onError, { once: true });
        });
      };

      setIsGenerating(true);
      const previewVideo = document.createElement("video");
      previewVideo.crossOrigin = videoEl.crossOrigin || "anonymous";
      previewVideo.muted = true;
      previewVideo.preload = "auto";
      previewVideo.playsInline = true;
      previewVideo.src = source;

      const captureWidth = 220;

      try {
        await waitFor(previewVideo, "loadedmetadata", 5000);
        if (cancelled) return;

        const aspect = previewVideo.videoWidth
          ? previewVideo.videoHeight / previewVideo.videoWidth
          : 9 / 16;
        const captureHeight = Math.max(60, Math.round(captureWidth * aspect));
        const canvas = document.createElement("canvas");
        canvas.width = captureWidth;
        canvas.height = captureHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const count = Math.min(14, Math.max(6, Math.round(duration / 4) + 6));
        const next = [];

        for (let i = 0; i < count; i++) {
          if (cancelled) break;
          const time = duration * (i / Math.max(count - 1, 1));
          previewVideo.currentTime = time;
          try {
            await waitFor(previewVideo, "seeked", 5000);
          } catch (_) {
            continue;
          }
          ctx.drawImage(previewVideo, 0, 0, captureWidth, captureHeight);
          next.push({ time, url: canvas.toDataURL("image/jpeg", 0.72) });
        }

        if (!cancelled) {
          setPreviews(next);
        }
      } catch (e) {
        if (!cancelled) {
          setPreviews([]);
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
        previewVideo.src = "";
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [videoRef, duration]);

  return { previews, isGenerating };
};

const VideoControls = ({
  isPlaying,
  onPlay,
  onPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  formatTime,
  videoRef,
}) => {
  const lastNonZeroVolumeRef = React.useRef(0.7);
  const timelineRef = React.useRef(null);
  const wasPlayingRef = React.useRef(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [hoverState, setHoverState] = React.useState(null);
  const { previews, isGenerating } = useFramePreviews(videoRef, duration);
  const { isAltTheme } = useTheme();

  React.useEffect(() => {
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

  const emitSeek = React.useCallback(
    (time) => {
      if (!Number.isFinite(time)) return;
      const next = clamp(time, 0, duration || 0);
      onSeek?.({ target: { value: next } });
    },
    [duration, onSeek]
  );

  const handleToggleMute = React.useCallback(() => {
    const nextVolume = volume > 0 ? 0 : lastNonZeroVolumeRef.current || 0.5;
    onVolumeChange?.({ target: { value: String(nextVolume) } });
  }, [onVolumeChange, volume]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const getTimeFromClientX = React.useCallback(
    (clientX) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect || !duration) return 0;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * duration;
    },
    [duration]
  );

  const handleScrubStart = React.useCallback(
    (e) => {
      if (!duration) return;
      setIsScrubbing(true);
      wasPlayingRef.current = isPlaying;
      if (isPlaying) onPause?.();
      const time = getTimeFromClientX(
        e.clientX || e.touches?.[0]?.clientX || 0
      );
      emitSeek(time);
    },
    [duration, emitSeek, getTimeFromClientX, isPlaying, onPause]
  );

  const handlePointerMove = React.useCallback(
    (e) => {
      if (!duration) return;
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const time = getTimeFromClientX(clientX);
      setHoverState({ time, clientX });
      if (isScrubbing) {
        emitSeek(time);
      }
    },
    [duration, emitSeek, getTimeFromClientX, isScrubbing]
  );

  const handleScrubEnd = React.useCallback(() => {
    if (!isScrubbing) return;
    setIsScrubbing(false);
    if (wasPlayingRef.current) {
      onPlay?.();
    }
  }, [isScrubbing, onPlay]);

  React.useEffect(() => {
    if (!isScrubbing) return undefined;
    const handleUp = () => handleScrubEnd();
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [handleScrubEnd, isScrubbing]);

  const hoverFrame = React.useMemo(() => {
    if (!hoverState) return null;
    if (!previews.length) {
      return { url: null, time: hoverState.time };
    }
    let closest = previews[0];
    let smallest = Math.abs(hoverState.time - previews[0].time);
    for (let i = 1; i < previews.length; i++) {
      const delta = Math.abs(hoverState.time - previews[i].time);
      if (delta < smallest) {
        closest = previews[i];
        smallest = delta;
      }
    }
    return { ...closest, time: hoverState.time };
  }, [hoverState, previews]);

  return (
    <div className={styles.videoControls}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.playButton}
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? "⏸" : "▶"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div
          className={clsx(
            styles.timeCluster,
            isAltTheme && styles.timeClusterAlt
          )}
        >
          <span
            className={clsx(
              styles.timeCurrent,
              isAltTheme && styles.timeCurrentAlt
            )}
          >
            {formatTime(currentTime)}
          </span>
          <span className={styles.timeDivider}>/</span>
          <span className={styles.timeTotal}>{formatTime(duration)}</span>
        </div>
        <div className={styles.volumeControl}>
          <VolumeIcon
            volume={volume}
            onClick={handleToggleMute}
            isAltTheme={isAltTheme}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={onVolumeChange}
            className={clsx(
              styles.volumeSlider,
              isAltTheme && styles.volumeSliderAlt
            )}
            aria-label="Volume"
          />
        </div>
      </div>

      <div className={styles.timelineWrapper}>
        <div
          className={styles.timeline}
          ref={timelineRef}
          onPointerDown={handleScrubStart}
          onPointerMove={handlePointerMove}
          onMouseMove={handlePointerMove}
          onTouchStart={handleScrubStart}
          onTouchMove={handlePointerMove}
          onMouseLeave={() => setHoverState(null)}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
          aria-label="Video timeline"
        >
          <div className={styles.frameStrip}>
            {previews.length > 0 ? (
              previews.map((frame, idx) => (
                <div
                  key={frame.time + idx}
                  className={styles.frame}
                  style={{
                    width: `${100 / previews.length}%`,
                    backgroundImage: `url(${frame.url})`,
                  }}
                />
              ))
            ) : (
              <div className={styles.frameFallback} />
            )}
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
            <div className={styles.playhead} style={{ left: `${progress}%` }}>
              <span className={styles.playheadKnob} />
            </div>
          </div>

          {hoverFrame && (
            <div
              className={styles.hoverCard}
              style={{
                left: `${clamp(
                  (hoverFrame.time / (duration || 1)) * 100,
                  0,
                  100
                )}%`,
              }}
            >
              {hoverFrame.url && (
                <div
                  className={styles.hoverThumb}
                  style={{ backgroundImage: `url(${hoverFrame.url})` }}
                />
              )}
              <div className={styles.hoverTime}>
                {formatTime(hoverFrame.time)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
