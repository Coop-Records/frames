import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Coop Recs Frame</title>
        <meta name="description" content="Coop Recs Frame" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content="https://mintnft-ruddy.vercel.app/red.png"
        />
        <meta name="og:image" content="op.png" />
        <meta name="fc:frame:post_url" content="https://mintnft.vercel.app/" />
        <link rel="icon" href="https://mintnft-ruddy.vercel.app/favicon.ico" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
}
