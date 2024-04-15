// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { endpointProd } from "@/utils/constants";

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
    if (req.body.untrustedData.buttonIndex === 1) {
      const shareText = `https://warpcast.com/~/compose?text=I'm%20going%20to%20FarConcert!%0A%0A${endpointProd}%2Ffarconcert&embeds[]=${endpointProd}/farconcert`;
      res.redirect(302, shareText);
      res.statusCode = 302;
      res.setHeader("location", shareText);
    }
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
