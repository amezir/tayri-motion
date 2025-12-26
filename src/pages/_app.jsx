import React, { useEffect, useState } from "react";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { LoaderProvider } from "@/contexts/LoaderContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Loader from "@/components/Loader/Loader";

export default function App({ Component, pageProps }) {
  const [isMobile, setIsMobile] = useState(false);

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
          <Component {...pageProps} />
        )}
        <Analytics />
      </LoaderProvider>
    </ThemeProvider>
  );
}
