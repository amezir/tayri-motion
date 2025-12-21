import Head from "next/head";

export default function SEO({
  title = "Tayri Motion - by Amézir Messaoud",
  description = "Explore Tayri Motion, an innovative web app by Amézir Messaoud that utilizes blob detection and video processing techniques for dynamic visual experiences.",
  keywords = "Tayri,Motion,Amézir,Messaoud,Tracking,Blob,Detection,Video,Processing,WebGL,JavaScript,Open Source",
  ogImage = "/og_image.png",
  ogUrl = "https://tayrimotion.vercel.app",
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
      <link rel="icon" href="/favicon.png" />
    </Head>
  );
}
