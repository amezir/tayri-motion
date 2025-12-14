import { useEffect, useRef } from "react";
import Head from "next/head";
import styles from "@/styles/index.module.scss";
import Link from "next/link";
import { gsap } from "gsap/dist/gsap";

export default function Home() {
  const titleRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const infoRef = useRef(null);

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
      <Head>
        <title>Tayri Garden</title>
        <meta name="description" content="Welcome To Tayri Garden" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.png" />
        <link rel="preload" href="./bg_video.mp4" as="video" type="video/mp4" />
      </Head>
      <main className={styles.main}>
        <section className={styles.containerHome}>
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
                <p className={styles.description}>Welcome To Tayri Garden</p>
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

            <div className={styles.infoBox} ref={infoRef}>
              <div className={styles.infoText}>
                Isolated pixels connect,
                <br />
                Bright zones become blobs.
                <br />
                Threshold applied, contours detected,
                <br />
                Each frame tells its trajectory.
              </div>
              <div className={styles.startButton}>
                <Link href="/tracking">
                  <button className={styles.buttonStart}>Get started</button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
