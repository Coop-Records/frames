import { GetServerSideProps } from "next";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";

interface HomeProps {
  artist: string;
  song: string;
  entry: any; // Adjust the type according to the data structure returned by Supabase
}

export default function Home({ artist, song, entry }: HomeProps) {
  const endpointLocal = "https://1d60-73-95-175-222.ngrok-free.app";
  const endpointProd = endpointLocal; //"https://frames.cooprecords.xyz";

  console.log(entry);

  // TODO: Implement OG Image initial
  const image = `${endpointProd}/api/generated/og/mint?copy=${entry.data.artist_name}\\n \\n${entry.data.song_name}\\n`;
  console.log(`${image}`);
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
          content={`${endpointProd}/api/${artist}/${song}`}
        />
        <meta name="fc:frame:button:1" content="Collect" />
      </Head>
      <div>This is a Farcaster frame. What are you doing here?</div>
    </>
  );
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
    .from("frames")
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
