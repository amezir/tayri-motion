import Head from "next/head";

export default function SEO({
  title = "Tayri Garden - by Amézir Messaoud",
  description = "Explore Tayri Garden, an innovative web app by Amézir Messaoud that utilizes blob detection and video processing techniques for dynamic visual experiences.",
  keywords = "Tayri,Garden,Amézir,Messaoud,Tracking,Blob,Detection,Video,Processing,WebGL,JavaScript,Open Source",
  ogImage = "/og_image.png",
  ogUrl = "https://tayrigarden.vercel.app",
  author = "Amézir Messaoud",
  robots = "index, follow",
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta charSet="UTF-8" />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
      <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      <link rel="icon" href="/favicon.png" />
      <link rel="preload" href="./bg_video.mp4" as="video" type="video/mp4" />
    </Head>
  );
}
