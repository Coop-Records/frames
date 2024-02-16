import Head from "next/head";

export default function Home() {
  const endpointLocal =
    "https://e623-2601-645-8a00-9db0-b5aa-f69a-f69-7ac2.ngrok-free.app";
  const endpointProd = "https://frames.cooprecords.xyz";
  return (
    <>
      <Head>
        <title>Coop Recs Frame</title>
        <meta name="description" content="Coop Recs Frame" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`${endpointProd}/toolsfmlbrisk/mint.png`}
        />
        <meta name="og:image" content="mint.png" />
        <meta
          name="fc:frame:post_url"
          content={`${endpointProd}/api/toolsfml/brisk`}
        />
        <meta name="fc:frame:button:1" content="Collect" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
}
