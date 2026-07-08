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
  selection = null,
  onSelectionChange,
  onClearSelection,
  onTrackSelection,
  segments = [],
  activeSegmentId = null,
  onSelectSegment,
  onSegmentResize,
  onDeleteSegment,
  onRetrackSegment,
}) => {
  const lastNonZeroVolumeRef = React.useRef(0.7);
  const timelineRef = React.useRef(null);
  const segmentTrackRef = React.useRef(null);
  const wasPlayingRef = React.useRef(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [hoverState, setHoverState] = React.useState(null);
  const [isSegDragging, setIsSegDragging] = React.useState(false);
  const segDragRef = React.useRef(null);
  const { previews, isGenerating } = useFramePreviews(videoRef, duration);
  const { isAltTheme } = useTheme();

  const segmentsEnabled = typeof onSelectionChange === "function";

  const pct = React.useCallback(
    (time) => (duration ? clamp((time / duration) * 100, 0, 100) : 0),
    [duration]
  );

  const timeFromSegmentX = React.useCallback(
    (clientX) => {
      const rect = segmentTrackRef.current?.getBoundingClientRect();
      if (!rect || !duration) return 0;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * duration;
    },
    [duration]
  );

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

  // ---- Selection / segment interactions on the segment track (#8, #9) ----
  const handleSegPointerDown = React.useCallback(
    (e) => {
      if (!segmentsEnabled || !duration) return;
      const rect = segmentTrackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const t = timeFromSegmentX(e.clientX);
      const edge = (12 / rect.width) * duration; // ~12px grab zone

      const activeSeg = segments.find((s) => s.id === activeSegmentId);
      if (activeSeg) {
        if (Math.abs(t - activeSeg.start) <= edge) {
          segDragRef.current = { mode: "seg-start", id: activeSeg.id };
          setIsSegDragging(true);
          return;
        }
        if (Math.abs(t - activeSeg.end) <= edge) {
          segDragRef.current = { mode: "seg-end", id: activeSeg.id };
          setIsSegDragging(true);
          return;
        }
      }

      if (selection) {
        if (Math.abs(t - selection.start) <= edge) {
          segDragRef.current = { mode: "sel", fixed: selection.end };
          setIsSegDragging(true);
          return;
        }
        if (Math.abs(t - selection.end) <= edge) {
          segDragRef.current = { mode: "sel", fixed: selection.start };
          setIsSegDragging(true);
          return;
        }
      }

      const hit = segments.find((s) => t >= s.start && t <= s.end);
      if (hit) {
        onSelectSegment?.(hit.id);
        return;
      }

      onSelectionChange?.({ start: t, end: t });
      segDragRef.current = { mode: "sel", fixed: t, isNew: true, moved: false };
      setIsSegDragging(true);
    },
    [
      segmentsEnabled,
      duration,
      timeFromSegmentX,
      segments,
      activeSegmentId,
      selection,
      onSelectSegment,
      onSelectionChange,
    ]
  );

  React.useEffect(() => {
    if (!isSegDragging) return undefined;

    const handleMove = (e) => {
      const drag = segDragRef.current;
      if (!drag) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const t = timeFromSegmentX(clientX);
      if (drag.mode === "sel") {
        drag.moved = true;
        onSelectionChange?.({ start: drag.fixed, end: t });
      } else if (drag.mode === "seg-start") {
        onSegmentResize?.(drag.id, { edge: "start", time: t });
      } else if (drag.mode === "seg-end") {
        onSegmentResize?.(drag.id, { edge: "end", time: t });
      }
    };

    const handleUp = () => {
      const drag = segDragRef.current;
      if (drag?.mode === "sel" && drag.isNew && !drag.moved) {
        onClearSelection?.();
      }
      segDragRef.current = null;
      setIsSegDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [
    isSegDragging,
    timeFromSegmentX,
    onSelectionChange,
    onSegmentResize,
    onClearSelection,
  ]);

  const activeSegment = segments.find((s) => s.id === activeSegmentId) || null;
  const activeSegmentIndex = segments.findIndex((s) => s.id === activeSegmentId);
  const selectionValid =
    selection && Math.abs(selection.end - selection.start) >= 0.2;

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

          {segmentsEnabled && (
            <div className={styles.segmentMarkers}>
              {segments.map((s) => (
                <div
                  key={s.id}
                  className={clsx(
                    styles.segmentMarker,
                    s.id === activeSegmentId && styles.segmentMarkerActive
                  )}
                  style={{
                    left: `${pct(s.start)}%`,
                    width: `${pct(s.end) - pct(s.start)}%`,
                  }}
                />
              ))}
              {selectionValid && (
                <div
                  className={styles.selectionMarker}
                  style={{
                    left: `${pct(selection.start)}%`,
                    width: `${pct(selection.end) - pct(selection.start)}%`,
                  }}
                />
              )}
            </div>
          )}

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

      {segmentsEnabled && (
        <div className={styles.segmentSection}>
          <div className={styles.segmentToolbar}>
            <span
              className={clsx(
                styles.segmentHint,
                isAltTheme && styles.segmentHintAlt
              )}
            >
              {activeSegment
                ? `Segment ${activeSegmentIndex + 1} · ${formatTime(
                    activeSegment.start
                  )}–${formatTime(activeSegment.end)}`
                : selectionValid
                ? `Selection · ${formatTime(selection.start)}–${formatTime(
                    selection.end
                  )}`
                : "Drag on the bar to select a range · click a segment to edit"}
            </span>

            <div className={styles.segmentToolbarActions}>
              {activeSegment ? (
                <>
                  <button
                    type="button"
                    className={clsx(
                      styles.segmentBtn,
                      isAltTheme && styles.segmentBtnAlt
                    )}
                    onClick={() => onRetrackSegment?.(activeSegment.id)}
                  >
                    Re-track
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.segmentBtn,
                      styles.segmentBtnDanger
                    )}
                    onClick={() => onDeleteSegment?.(activeSegment.id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.segmentBtn,
                      isAltTheme && styles.segmentBtnAlt
                    )}
                    onClick={() => onSelectSegment?.(activeSegment.id)}
                  >
                    Done
                  </button>
                </>
              ) : selectionValid ? (
                <>
                  <button
                    type="button"
                    className={styles.segmentBtnPrimary}
                    onClick={() => onTrackSelection?.()}
                  >
                    Track selection
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.segmentBtn,
                      isAltTheme && styles.segmentBtnAlt
                    )}
                    onClick={() => onClearSelection?.()}
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span
                  className={clsx(
                    styles.segmentCount,
                    isAltTheme && styles.segmentCountAlt
                  )}
                >
                  {segments.length}{" "}
                  {segments.length === 1 ? "segment" : "segments"}
                </span>
              )}
            </div>
          </div>

          <div
            className={clsx(
              styles.segmentTrack,
              isAltTheme && styles.segmentTrackAlt
            )}
            ref={segmentTrackRef}
            onPointerDown={handleSegPointerDown}
          >
            {segments.length === 0 && !selectionValid && (
              <span className={styles.segmentTrackEmpty}>
                whole video tracked · drag here to limit tracking to a range
              </span>
            )}

            {segments.map((s, i) => {
              const isActive = s.id === activeSegmentId;
              return (
                <div
                  key={s.id}
                  className={clsx(
                    styles.segmentBand,
                    isActive && styles.segmentBandActive
                  )}
                  style={{
                    left: `${pct(s.start)}%`,
                    width: `${Math.max(pct(s.end) - pct(s.start), 0.5)}%`,
                  }}
                >
                  <span className={styles.segmentBandLabel}>{i + 1}</span>
                  {isActive && (
                    <>
                      <span
                        className={clsx(styles.segHandle, styles.segHandleStart)}
                      />
                      <span
                        className={clsx(styles.segHandle, styles.segHandleEnd)}
                      />
                    </>
                  )}
                </div>
              );
            })}

            {selection && (
              <div
                className={styles.selectionBand}
                style={{
                  left: `${pct(Math.min(selection.start, selection.end))}%`,
                  width: `${Math.max(
                    pct(Math.max(selection.start, selection.end)) -
                      pct(Math.min(selection.start, selection.end)),
                    0.5
                  )}%`,
                }}
              >
                <span className={clsx(styles.selHandle, styles.selHandleStart)} />
                <span className={clsx(styles.selHandle, styles.selHandleEnd)} />
              </div>
            )}

            <div
              className={styles.segPlayhead}
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoControls;
