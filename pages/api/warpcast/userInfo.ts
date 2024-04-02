// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, createWalletClient, http } from "viem";
import { supabase } from "@/lib/supabaseClient";
import { privateKeyToAccount } from "viem/accounts";
import { base, optimism } from "viem/chains";

const neynarApiKey: string = process.env.NEYNAR_ONCHAIN_KIT_API_KEY as string;
const baseAlchemyKey = process.env.ALCHEMY_KEY as string;
const baseUrl = `https://base-mainnet.g.alchemy.com/v2/${baseAlchemyKey}`;

const opAlchemyKey = process.env.OP_ALCHEMY_KEY as string;
const opUrl = `https://opt-mainnet.g.alchemy.com/v2/${opAlchemyKey}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { addresses } = req.query;
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses}`,
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

    console.log(data);

    res.status(200).json({ data });
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
