import { GetServerSideProps } from "next";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { ButtonType, endpointProd } from "@/utils/constants";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface HomeProps {
  artist: string;
  song: string;
  entry: any; // Adjust the type according to the data structure returned by Supabase
}

export default function Home({ artist, song, entry }: HomeProps) {
  const router = useRouter();

  useEffect(() => {
    router.push(
      "https://www.sound.xyz/playlist/8af38c99-c1ff-4f22-be0a-f188dde3d576"
    );
  }, [router]);

  const image = `${endpointProd}/api/generated/og/mint?hume=${entry.data.humeLogo}&image=${entry.data.image_url}&copy=${entry.data.artist_name}\\n \\n${entry.data.song_name}\\n`;
  return (
    <>
      <Head>
        <title>Coop Recs Frame</title>
        <meta name="description" content="Coop Recs Frame" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={image} />
        <meta name="og:image" content={entry?.data?.image_url} />
        <meta
          name="fc:frame:post_url"
          content={`${endpointProd}/api/v2/generated/${artist}/${song}`}
        />
        {FCButton(1, entry.data.button1Type)}
        {FCButton(2, entry.data.button2Type)}
        {FCButton(3, entry.data.button3Type)}
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );

  function FCButton(index: number, buttonType: ButtonType) {
    switch (buttonType) {
      case "limited":
        return (
          <>
            <meta name={`fc:frame:button:${index}`} content="Buy Limited" />
            <meta property={`fc:frame:button:${index}:action`} content="tx" />
            <meta
              name={`fc:frame:button:${index}:target`}
              content={`${endpointProd}/api/v2/generated/${artist}/${song}`}
            />
          </>
        );
      case "open":
        return (
          <>
            <meta name={`fc:frame:button:${index}`} content="Buy Unlimited" />
            <meta property={`fc:frame:button:${index}:action`} content="tx" />
            <meta
              name={`fc:frame:button:${index}:target`}
              content={`${endpointProd}/api/v2/generated/${artist}/${song}`}
            />
          </>
        );
      case "sponsoredfree":
        return <meta name={`fc:frame:button:${index}`} content="Claim Free" />;
      case "sponsoredlimited":
        return <meta name={`fc:frame:button:${index}`} content="Claim Free" />;
      case "link":
        return (
          <>
            <meta name={`fc:frame:button:${index}`} content="Listen" />
            <meta
              name={`fc:frame:button:${index}:action`}
              content="post_redirect"
            />
          </>
        );
      case "none":
        return <></>;
    }
  }
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  params,
}) => {
  if (
    !params ||
    typeof params.artist !== "string" ||
    typeof params.song !== "string"
  ) {
    return {
      notFound: true,
    };
  }

  const { artist, song } = params;

  console.log(artist, song);

  const entry = await supabase
    .from("framesV2")
    .select(
      "image_url,artist_name,song_name,contract_address,contract_chain,wallet_address,artist_smash,song_smash,chain,button1Price,button2Price,button3Price,button1Type,button2Type,button3Type,superminteroverride,button1link,button2link,button3link,humeLogo"
    )
    .eq("artist_smash", artist)
    .eq("song_smash", song)
    .single();

  if (!entry) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      artist,
      song,
      entry,
    },
  };
};
