import React, { useEffect, useState } from "react";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { LoaderProvider } from "@/contexts/LoaderContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Loader from "@/components/Loader/Loader";

export default function App({ Component, pageProps }) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function check() {
      const w = window.innerWidth || 0;
      setIsMobile(w <= 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <ThemeProvider>
      <LoaderProvider>
        <Loader />
        {isMobile ? (
          <div className="overlayStyles" aria-live="polite">
            <div className="boxStyles">
              <img src="./logo.png" alt="Tayri Motion" draggable="false" />
              <h1>Tayri Motion</h1>
              <p>Tayri Motion is only available on desktop.</p>
              <p>Please use a desktop device to access the site.</p>
              <p>For the future, we plan to support mobile devices.</p>
            </div>
          </div>
        ) : (
          // Curtain wipe: on navigation a panel rises up from the bottom to cover
          // the screen, the page swaps underneath, then the panel drops back
          // down. Only the fixed panel moves — the page content is never
          // transformed, so its own `position: fixed` overlays stay anchored to
          // the viewport.
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.asPath}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Component {...pageProps} />
              <motion.div
                aria-hidden="true"
                variants={{
                  initial: { y: "0%" },
                  animate: { y: "100%" },
                  exit: { y: "0%" },
                }}
                transition={{ duration: 0.45, ease: [0.83, 0, 0.17, 1] }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "#dde000",
                  zIndex: 99999,
                  pointerEvents: "none",
                  willChange: "transform",
                }}
              />
            </motion.div>
          </AnimatePresence>
        )}
        <Analytics />
      </LoaderProvider>
    </ThemeProvider>
  );
}
