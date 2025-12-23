import React from "react";
import styles from "./VideoControls.module.scss";

const VolumeIcon = ({ volume, onClick }) => {
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
      className={styles.volumeIcon}
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
}) => {
  const lastNonZeroVolumeRef = React.useRef(0.7);

  React.useEffect(() => {
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

  const handleToggleMute = React.useCallback(() => {
    const nextVolume = volume > 0 ? 0 : lastNonZeroVolumeRef.current || 0.5;
    onVolumeChange({ target: { value: String(nextVolume) } });
  }, [onVolumeChange, volume]);

  return (
    <div className={styles.videoControls}>
      <button onClick={isPlaying ? onPause : onPlay}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={onSeek}
        step="0.1"
        className={styles.videoSeeker}
      />
      <div className={styles.videoTime}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <div className={styles.volumeControl}>
        <VolumeIcon volume={volume} onClick={handleToggleMute} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={onVolumeChange}
          className={styles.volumeSlider}
        />
      </div>
    </div>
  );
};

export default VideoControls;
