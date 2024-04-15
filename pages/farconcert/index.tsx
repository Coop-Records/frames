import Head from "next/head";
import { endpointProd } from "@/utils/constants";

export default function Home() {
  return (
    <>
      <Head>
        <title>Farconcert</title>
        <meta name="description" content="Farconcert" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`${endpointProd}/farconcert/mint.png`}
        />
        <meta name="og:image" content={`${endpointProd}/farconcert/mint.png`} />
        <meta
          name="fc:frame:post_url"
          content={`${endpointProd}/api/farconcert`}
        />
        <meta name={`fc:frame:button:1`} content="Purchase Ticket" />
        <meta property={`fc:frame:button:1:action`} content="tx" />
        <meta
          name={`fc:frame:button:1:target`}
          content={`${endpointProd}/api/farconcert`}
        />
        <meta name={`fc:frame:button:2`} content="Check Status" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
}
