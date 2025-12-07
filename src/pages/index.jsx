import Head from "next/head";
import styles from "@/styles/index.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Trinity Garden</title>
        <meta name="description" content="Welcome To Trinity Garden" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className={styles.main}>
        <section className={styles.containerHome}>
          <video
            src="https://pub-d8ee72e371f24aa596721d8d40a1acdc.r2.dev/blob-tracking-1765113968031.mp4"
            autoPlay
            loop
            muted
            className={styles.videoBG}/>
          <div className={styles.contentHome}>
            <div className={styles.contentBox}>
              <div className={styles.topContent}>
                <p>Copyright © 2025 Trinity Garden</p>
              </div>
              <div className={styles.centerContent}>
                <img src="./logo.png" alt="logo" draggable="false" />
                <h1 className={styles.title}>Trinity Garden</h1>
                <p className={styles.description}>Welcome To Trinity Garden</p>
              </div>
              <div className={styles.bottomContent}>
                <img src="./codebar.png" alt="codebar logo" draggable="false" />
                <p>
                  Made by <a href="https://amezirmessaoud.fr" className={styles.link}>Amézir Messaoud</a>
                </p>
              </div>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoText}>
                Isolated pixels connect,<br />Bright zones become blobs.<br />Threshold applied, contours detected,<br />Each frame tells its trajectory.
              </div>
              <div className={styles.infoUse}>
                ️<p className={styles.useTitle}>How to use</p> 
                <ul className={styles.useList}>
                  <li>01. Upload file</li>
                  <li>02. Edit</li>
                  <li>03. Download</li>
                </ul>
              </div>
              <div className={styles.startButton}>
                <Link href="/tracking">
                  <button className={styles.buttonStart}>Get Started</button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
