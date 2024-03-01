// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const neynarApiKey: string = process.env.NEYNAR_ONCHAIN_KIT_API_KEY as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/frame/validate",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          api_key: neynarApiKey,
          "Content-Type": "application/json",
        },
        // If you need to send a body, add it here
        body: JSON.stringify({
          message_bytes_in_hex: req.body.trustedData.messageBytes,
        }),
      }
    );

    const data = await response.json();

    const address = data.action.interactor.verifications[0] as `0x${string}`;

    if (!address) {
      throw new Error();
    }

    const userFid = data.action.interactor.fid as number;

    if (await isFollowingCoopChannelAndAccount(userFid)) {
      res.status(200).send("");
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function isFollowingCoopChannelAndAccount(fid: number): Promise<boolean> {
  return isFollowingChannel(fid, "boombox");
}

async function isFollowingHume(fid: number): Promise<boolean> {
  `https://api.neynar.com/v1/farcaster/user`;
  const response = await (
    await fetch(
      `https://api.neynar.com/v1/farcaster/user?fid=363197&viewerFid=${fid}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          api_key: neynarApiKey,
          "Content-Type": "application/json",
        },
      }
    )
  ).json();

  return response?.result?.user?.viewerContext?.following;
}

async function isFollowingChannel(
  fid: number,
  channel: string
): Promise<boolean> {
  //https://api.neynar.com/v2/farcaster/channel/followers?id=founders&limit=25
  let cursor = "";

  while (true) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel/followers?id=${channel}&limit=1000${
        cursor !== "" ? `&cursor=${cursor}` : ""
      }`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          api_key: neynarApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    const fids = data.users.map((user: { fid: any }) => user.fid);

    if (fids.includes(fid)) {
      console.log(fid, channel, true);
      return true;
    }

    if (data?.next?.cursor === undefined) {
      break;
    } else {
      cursor = data.next.cursor;
    }
  }
  console.log(fid, channel, false);

  return false;
}
