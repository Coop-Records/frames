import { GetServerSideProps } from "next";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { ButtonType, endpointProd } from "@/utils/constants";
import { isNil } from "lodash";

interface HomeProps {
  artist: string;
  song: string;
  entry: any; // Adjust the type according to the data structure returned by Supabase
}

export default function Home({ artist, song, entry }: HomeProps) {
  const image = `${endpointProd}/api/generated/og/mint?image=${entry.data.image_url}&copy=${entry.data.artist_name}\\n \\n${entry.data.song_name}\\n`;
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
          content={`${endpointProd}/api/generated/${artist}/${song}`}
        />
        {FCButton(1, entry.button1Type)}
        {FCButton(2, entry.button2Type)}
        {FCButton(3, entry.button3Type)}
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );

  function FCButton(index: number, buttonType: ButtonType) {
    switch (buttonType) {
      case "limited":
        return (
          <>
            <meta
              name={`fc:frame:button:${index}`}
              content="Buy Limited Edition"
            />
            <meta property={`fc:frame:button:${index}:action`} content="tx" />
            <meta
              name={`fc:frame:button:${index}:target`}
              content={`${endpointProd}/api/generated/${artist}/${song}`}
            />
          </>
        );
      case "open":
        return (
          <>
            <meta
              name={`fc:frame:button:${index}`}
              content="Buy Open Edition"
            />
            <meta property={`fc:frame:button:${index}:action`} content="tx" />
            <meta
              name={`fc:frame:button:${index}:target`}
              content={`${endpointProd}/api/generated/${artist}/${song}`}
            />
          </>
        );
      case "sponsored":
        return (
          <meta
            name={`fc:frame:button:${index}`}
            content="Claim Free Edition"
          />
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
    .select("*")
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
