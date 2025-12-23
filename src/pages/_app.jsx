import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { LoaderProvider } from "@/contexts/LoaderContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Loader from "@/components/Loader/Loader";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <LoaderProvider>
        <Loader />
        <Component {...pageProps} />
        <Analytics />
      </LoaderProvider>
    </ThemeProvider>
  );
}
