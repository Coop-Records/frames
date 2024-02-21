import Head from "next/head";

export default function Home() {
  const endpointLocal = "https://b456-104-59-124-88.ngrok-free.app";
  const endpointProd = endpointLocal; // = "https://frames.cooprecords.xyz";
  return (
    <>
      <Head>
        <title>Coop Recs Frame</title>
        <meta name="description" content="Coop Recs Frame" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`${endpointProd}/unanoche/mint.jpg`}
        />
        <meta name="og:image" content="mint.jpg" />
        <meta
          name="fc:frame:post_url"
          content={`${endpointProd}/api/hume/unanoche`}
        />
        <meta name="fc:frame:button:1" content="Collect" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
}
