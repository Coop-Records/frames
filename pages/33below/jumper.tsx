import Head from "next/head";

export default function Home() {
  const endpointLocal =
    "https://dcd5-2601-645-8a00-9db0-4132-783f-3890-61af.ngrok-free.app";
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
          content={`${endpointProd}/33belowJumper/mint.png`}
        />
        <meta name="og:image" content="mint.png" />
        <meta
          name="fc:frame:post_url"
          content={`${endpointProd}/api/33below/jumper`}
        />
        <meta name="fc:frame:button:1" content="Collect" />
        {/* <meta name="fc:frame:button:2" content="Listen on Sound" /> */}
        <meta name="fc:frame:button:2:action" content="post_redirect" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
}
