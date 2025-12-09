import { useLoader } from "@/contexts/LoaderContext";
import styles from "@/styles/loader.module.css";

export default function Loader() {
  const { isLoading, progress } = useLoader();

  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.logo}>
          <img src="./logo.png" alt="logo" draggable="false" />
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>{progress}%</p>
        </div>
      </div>
    </div>
  );
}
