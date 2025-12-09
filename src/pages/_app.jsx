import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { LoaderProvider } from "@/contexts/LoaderContext";
import Loader from "@/components/Loader";

export default function App({ Component, pageProps }) {
  return (
    <LoaderProvider>
      <Loader />
      <Component {...pageProps} />
      <Analytics />
    </LoaderProvider>
  );
}
