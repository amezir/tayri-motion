import Link from "next/link";
import clsx from "clsx";
import SEO from "@/components/SEO";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "@/styles/legal-notice.module.scss";

export default function LegalNotice() {
  const { isAltTheme } = useTheme();
  const lastUpdate = "December 23, 2025";

  return (
    <>
      <SEO
        title="Legal Notice - Tayri Motion"
        description="Legal information and contact details for the Tayri Motion site."
        robots="noindex, follow"
      />
      <main className={clsx(styles.main, isAltTheme && styles.mainAlt)}>
        <div className={styles.topBar}>
          <Link
            href="/"
            className={clsx(styles.backLink, isAltTheme && styles.backLinkAlt)}
          >
            Back to Home
          </Link>
        </div>

        <div
          className={clsx(styles.container, isAltTheme && styles.containerAlt)}
        >
          <header className={styles.header}>
            <p className={styles.meta}>Last updated: {lastUpdate}</p>
            <h1 className={clsx(styles.title, isAltTheme && styles.titleAlt)}>
              Legal Notice
            </h1>
            <p className={styles.lead}>
              This page outlines the publisher identity, hosting details, and
              the terms that apply to the Tayri Motion service.
            </p>
          </header>

          <div className={styles.grid}>
            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Site Publisher
              </h2>
              <p className={styles.paragraph}>
                Tayri Motion is published by Amézir Messaoud.
              </p>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  LinkedIn:{" "}
                  <a
                    href="https://www.linkedin.com/in/amezirmessaoud/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    amezir messaoud
                  </a>
                </li>
                <li className={styles.listItem}>
                  Email:{" "}
                  <a href="mailto:amezirmessaoud.test@gmail.com">
                    amezirmessaoud.test@gmail.com
                  </a>
                </li>
                <li className={styles.listItem}>
                  Personal site:{" "}
                  <a
                    href="https://amezirmessaoud.fr"
                    target="_blank"
                    rel="noreferrer"
                  >
                    amezirmessaoud.fr
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Publication Manager
              </h2>
              <p className={styles.paragraph}>
                Amézir Messaoud, reachable at the contact listed above.
              </p>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Hosting
              </h2>
              <p className={styles.paragraph}>The site is hosted by:</p>
              <ul className={styles.list}>
                <li className={styles.listItem}>Vercel Inc.</li>
                <li className={styles.listItem}>
                  440 N Wolfe Rd, Sunnyvale, CA 94085, USA
                </li>
                <li className={styles.listItem}>
                  Site:{" "}
                  <a href="https://vercel.com" target="_blank" rel="noreferrer">
                    vercel.com
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Intellectual Property
              </h2>
              <p className={styles.paragraph}>
                Visual assets, copy, and technical elements of Tayri Motion are
                protected by intellectual property law. Any reproduction or
                distribution, in whole or in part, without prior written
                permission is prohibited.
              </p>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Personal Data
              </h2>
              <p className={styles.paragraph}>
                Tayri Motion only uses data strictly necessary for the app to
                work (local video uploads, display preferences). No advertising
                tracking or data resale is performed. You can request deletion
                of your data by emailing the contact address.
              </p>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Cookies
              </h2>
              <p className={styles.paragraph}>
                Cookies are limited to technical needs (theme preferences,
                technical usage metrics). You can disable cookies in your
                browser settings, though some features may degrade.
              </p>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Liability
              </h2>
              <p className={styles.paragraph}>
                Tayri Motion uses reasonable means to ensure service access and
                processing reliability. However, no absolute guarantee is
                provided regarding continuous availability or the total absence
                of errors. Users remain solely responsible for processing and
                exports performed from their own videos.
              </p>
            </section>

            <section className={styles.section}>
              <h2
                className={clsx(
                  styles.sectionTitle,
                  isAltTheme && styles.sectionTitleAlt
                )}
              >
                Contact
              </h2>
              <p className={styles.paragraph}>
                For any questions, email{" "}
                <a href="mailto:amezirmessaoud.test@gmail.com">
                  amezirmessaoud.test@gmail.com
                </a>{" "}
                or visit the publisher's personal site.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
