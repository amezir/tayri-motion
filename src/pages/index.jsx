import { useEffect, useRef, useState } from "react";
import styles from "@/styles/index.module.scss";
import Link from "next/link";
import { gsap } from "gsap/dist/gsap";
import clsx from "clsx";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const titleRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const infoRef = useRef(null);
  const { isAltTheme, setIsAltTheme } = useTheme();

  const stages = [
    { id: 1, name: 'Load base algorithms', status: 'OK' },
    { id: 2, name: 'Load base algorithms', status: 'OK' },
    { id: 3, name: 'Load base algorithms', status: 'OK' },
    { id: 4, name: 'Load base algorithms', status: 'OK' },
    { id: 5, name: 'Load base algorithms', status: 'OK' },
  ];

  useEffect(() => {
    if (!videoRef.current || !contentRef.current || !infoRef.current) return;

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
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 24, letterSpacing: "0.5em" },
          {
            opacity: 1,
            y: 0,
            letterSpacing: "0.05em",
            duration: 3.2,
            ease: "power3.out",
          },
          "<"
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <SEO />
      <main className={clsx(styles.main, isAltTheme && styles.mainAlt)}>
        <section className={clsx(styles.containerHome, isAltTheme && styles.containerHomeAlt)}>
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
                <div></div>
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
                <h1 className={styles.title} ref={titleRef}>
                  Tayri Garden
                </h1>
                <p className={styles.description}> Track and export blobs from your videos with ease.</p>
              </div>
              <div className={styles.bottomContent}>
                <img src="./codebar.png" alt="codebar logo" draggable="false" />
                <p>
                  Made by{" "}
                  <a href="https://amezirmessaoud.fr" className={styles.link}>
                    Amézir Messaoud
                  </a>
                </p>
              </div>
            </div>

            <div
              className={clsx(styles.infoBox, isAltTheme && styles.infoBoxAlt)}
              ref={infoRef}
            >
              <div className={styles.infoText}>
                <span className={clsx(styles.infoTextVersion, isAltTheme && styles.infoTextVersionAlt)}>
                  [last version - <a href="">more infos</a>]
                </span>
                
                {stages.map((stage) => (
                  <p 
                    key={stage.id}
                    className={clsx(styles.infoTextStage, isAltTheme && styles.infoTextStageAlt)}
                  >
                    {'>'} Stage {String(stage.id).padStart(2, '0')} / {stage.name} ........ {stage.status}
                  </p>
                ))}
                
                <span className={styles.infoTextDate}>
                  {'>>>'}&nbsp; RELEASE 2025.09 COMPLETED
                </span>
              </div>
              <div className={styles.startButton}>
                <Link href="/">
                  <button
                    className={clsx(styles.buttonStart, isAltTheme && styles.buttonStartAlt)}
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
