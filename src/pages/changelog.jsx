import styles from "@/styles/changelog.module.scss";
import Link from "next/link";
import clsx from "clsx";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";
import changelogData from "@/data/changelog.json";

export default function Changelog() {
  const { isAltTheme, setIsAltTheme } = useTheme();

  return (
    <>
      <SEO title="Changelog - Blob Tracking" />
      <main className={clsx(styles.main, isAltTheme && styles.mainAlt)}>
        <button
          className={styles.toggleButton}
          onClick={() => setIsAltTheme(!isAltTheme)}
          aria-label="Toggle theme"
        >
          {isAltTheme ? "dark" : "light"}
        </button>

        <div
          className={clsx(
            styles.changelogContainer,
            isAltTheme && styles.changelogContainerAlt
          )}
        >
          <div className={styles.header}>
            <h1 className={clsx(styles.title, isAltTheme && styles.titleAlt)}>
              Changelog
            </h1>
          </div>

          <div className={styles.releases}>
            {changelogData.releases.map((release, index) => (
              <div
                key={index}
                className={clsx(
                  styles.releaseBlock,
                  isAltTheme && styles.releaseBlockAlt
                )}
              >
                <div className={styles.releaseHeader}>
                  <span
                    className={clsx(
                      styles.releaseVersion,
                      isAltTheme && styles.releaseVersionAlt
                    )}
                  >
                    [last version - {release.release}]
                  </span>
                  <Link href="/" className={styles.backLink}>
                    ← Back to Home
                  </Link>
                </div>

                <div className={styles.stagesList}>
                  {[...release.stages].reverse().map((stage) => (
                    <p
                      key={stage.id}
                      className={clsx(
                        styles.stageItem,
                        isAltTheme && styles.stageItemAlt
                      )}
                    >
                      {">"} Stage {String(stage.id).padStart(2, "0")} /{" "}
                      {stage.name} ........ {stage.status}
                    </p>
                  ))}
                </div>

                <div
                  className={clsx(
                    styles.releaseStatus,
                    isAltTheme && styles.releaseStatusAlt
                  )}
                >
                  {">>>"}&nbsp; RELEASE {release.release}{" "}
                  {release.releaseStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
