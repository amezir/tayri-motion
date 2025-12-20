import React from "react";
import styles from "./VideoControls.module.scss";

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
        <span className={styles.volumeIcon}>
          {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </span>
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
