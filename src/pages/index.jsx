import { useEffect, useRef, useState } from "react";
import styles from "@/styles/index.module.scss";
import Link from "next/link";
import { gsap } from "gsap/dist/gsap";
import SEO from "@/components/SEO";

export default function Home() {
  const titleRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const infoRef = useRef(null);
  const [isAltTheme, setIsAltTheme] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("isAltTheme");
    if (stored === "1") {
      setIsAltTheme(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("isAltTheme", isAltTheme ? "1" : "0");
  }, [isAltTheme]);

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
      <main className={`${styles.main} ${isAltTheme ? styles.mainAlt : ""}`}>
        <section className={`${styles.containerHome} ${isAltTheme ? styles.containerHomeAlt : ""}`}>
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
              className={`${styles.infoBox} ${isAltTheme ? styles.infoBoxAlt : ""}`}
              ref={infoRef}
            >
              <div className={styles.infoText}>
                Isolated pixels connect,
                <br />
                Bright zones become blobs.
                <br />
                Threshold applied, contours detected,
                <br />
                Each frame tells its trajectory.
              </div>
                <button
                  type="button"
                  className={`${styles.toggleButton}`}
                  onClick={() => setIsAltTheme((prev) => !prev)}
                >
                  {isAltTheme ? "🌙" : "☀️"}
                </button>
              <div className={styles.startButton}>
                <Link href="/tracking">
                  <button
                    className={`${styles.buttonStart} ${isAltTheme ? styles.buttonStartAlt : ""}`}
                  >
                    Get started
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
