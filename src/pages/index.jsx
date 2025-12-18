import { useEffect, useRef, useState } from "react";
import styles from "@/styles/index.module.scss";
import Link from "next/link";
import { gsap } from "gsap/dist/gsap";
import clsx from "clsx";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";
import changelogData from "@/data/changelog.json";

export default function Home() {
  const titleRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const infoRef = useRef(null);
  const hasAnimated = useRef(false);
  const { isAltTheme, setIsAltTheme } = useTheme();

  const latestRelease = changelogData.releases[0];
  const stages = [...latestRelease.stages].reverse().slice(0, 5);

  useEffect(() => {
    if (!videoRef.current || !contentRef.current || !infoRef.current) return;

    if (hasAnimated.current) {
      gsap.set(videoRef.current, { scale: 1, filter: "blur(8px)" });
      gsap.set([contentRef.current, infoRef.current], { opacity: 1, y: 0 });
      if (titleRef.current) {
        gsap.set(titleRef.current, {
          attr: { "stroke-dashoffset": 0 },
          fill: "#dde000",
          opacity: 1,
        });
      }
      return;
    }

    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.set([contentRef.current, infoRef.current], { opacity: 0, y: 16 });

      const tl = gsap.timeline();

      tl.fromTo(
        videoRef.current,
        { scale: 0.1, filter: "blur(0.1px)" },
        {
          scale: 1,
          filter: "blur(8px)",
          duration: 1.8,
          ease: "expoScale(0.5,7,none)",
        }
      );

      tl.to(
        [contentRef.current, infoRef.current],
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.15,
        },
        "-=0.1"
      );

      if (titleRef.current) {
        const textEl = titleRef.current;
        const bbox = textEl.getBBox();
        const dash = Math.max(800, bbox.width * 2.4);

        gsap.set(textEl, {
          attr: {
            "stroke-dasharray": dash,
            "stroke-dashoffset": dash,
          },
          opacity: 1,
        });

        tl.to(
          textEl,
          {
            attr: { "stroke-dashoffset": 0 },
            duration: 2.8,
            ease: "power2.inOut",
          },
          "<"
        );

        tl.to(
          textEl,
          {
            fill: "#dde000",
            duration: 0.8,
            ease: "power1.out",
          },
          "-=0.6"
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <SEO />
      <main className={clsx(styles.main, isAltTheme && styles.mainAlt)}>
        <section
          className={clsx(
            styles.containerHome,
            isAltTheme && styles.containerHomeAlt
          )}
        >
          <video
            src="./bg_video.mp4"
            autoPlay
            loop
            muted
            className={styles.videoBG}
            ref={videoRef}
          />
          <div className={styles.contentHome}>
            <div className={styles.contentBox} ref={contentRef}>
              <div className={styles.topContent}>
                <p>Copyright © 2025 Tayri Garden</p>
                <button
                  type="button"
                  className={`${styles.toggleButton}`}
                  onClick={() => setIsAltTheme((prev) => !prev)}
                >
                  {isAltTheme ? "dark" : "light"}
                </button>
              </div>
              <div className={styles.centerContent}>
                <img src="./logo.png" alt="logo" draggable="false" />
                <h1 className={styles.visuallyHidden}>Tayri Garden</h1>
                <svg
                  className={styles.titleSvg}
                  viewBox="0 0 1000 200"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Tayri Garden"
                  draggable="false"
                  role="heading"
                  aria-level="1"
                >
                  <text
                    ref={titleRef}
                    className={styles.titleText}
                    x="50%"
                    y="60%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                  >
                    Tayri Garden
                  </text>
                </svg>
                <p className={styles.description}>
                  {" "}
                  Track and export blobs from your videos with ease.
                </p>
              </div>
              <div className={styles.bottomContent}>
                <img src="./codebar.png" alt="codebar logo" draggable="false" />
                <p>
                  Made by{" "}
                  <a href="https://amezirmessaoud.fr" className={styles.link}>
                    Amézir Messaoud
                  </a>
                </p>
                <div className={styles.poem}>
                  <p>
                    Isolated pixels connect,
                    <br />
                    Bright zones become blobs.
                    <br />
                    Threshold applied, contours detected,
                    <br />
                    Each frame tells its trajectory.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={clsx(styles.infoBox, isAltTheme && styles.infoBoxAlt)}
              ref={infoRef}
            >
              <div className={styles.infoText}>
                <span
                  className={clsx(
                    styles.infoTextVersion,
                    isAltTheme && styles.infoTextVersionAlt
                  )}
                >
                  [last version - <Link href="/changelog">more infos</Link>]
                </span>

                {stages.map((stage) => (
                  <p
                    key={stage.id}
                    className={clsx(
                      styles.infoTextStage,
                      isAltTheme && styles.infoTextStageAlt
                    )}
                  >
                    {">"} Stage {String(stage.id).padStart(2, "0")} /{" "}
                    {stage.name} ........ {stage.status}
                  </p>
                ))}

                <span className={styles.infoTextDate}>
                  {">>>"}&nbsp; RELEASE {latestRelease.release}{" "}
                  {latestRelease.releaseStatus}
                </span>
              </div>
              <div className={styles.startButton}>
                <Link href="/">
                  <button
                    className={clsx(
                      styles.buttonStart,
                      isAltTheme && styles.buttonStartAlt
                    )}
                  >
                    Soon
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
