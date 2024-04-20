// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import FarconcertTicket from "@/abis/farconcertticket.json";
import { encodeFunctionData, parseEther } from "viem";
import { endpointProd } from "@/utils/constants";
import { BASEpublicServerClient } from "@/utils/client";

const ticketContractAddress = "0xB791556273B26389BcB4865DB028898f125E4319";
const price = "0.005";

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

    const userFid = data.action.interactor.fid as number;
    if (!address) {
      notVerified(res);
    } else if (req.body.untrustedData.buttonIndex === 1) {
      const mintHex = encodeFunctionData({
        abi: FarconcertTicket,
        functionName: "mintTo",
        args: [address],
      });
      res.status(200).json({
        chainId: `eip155:8453`,
        method: "eth_sendTransaction",
        attribution: false,
        params: {
          abi: FarconcertTicket, // JSON ABI of the function selector and any errors
          to: ticketContractAddress,
          data: mintHex,
          value: parseEther(price).toString(),
        },
      });
    } else if (req.body.untrustedData.buttonIndex === 2) {
      if (await goingToFarconcert(address)) {
        successScreen(res);
      } else {
        youDontHaveTicket(res);
      }
    } else {
      successScreen(res);
    }
  } catch (error) {
    console.error("Request failed:", error);
    notVerified(res);
  }

  function successScreen(res: NextApiResponse) {
    const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${`${endpointProd}/farconcert/congrats.png`}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content=${endpointProd}/api/farconcert/status
                  />
                  <meta name="fc:frame:button:1" content="Share" />
                  <meta name="fc:frame:button:1:action" content="post_redirect" />
                  `;
    res.setHeader("Content-Type", "text/html");

    res.status(200).send(htmlContent);
  }

  function youDontHaveTicket(res: NextApiResponse) {
    const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${`${endpointProd}/farconcert/noticket.png`}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content="${endpointProd}/api/farconcert"
                  />
                  <meta name="fc:frame:button:1" content="Purchase Ticket" />
                  <meta property="fc:frame:button:1:action" content="tx" />
                  <meta
                    name="fc:frame:button:1:target"
                    content="${endpointProd}/api/farconcert"
                  />
                  `;
    res.setHeader("Content-Type", "text/html");

    res.status(200).send(htmlContent);
  }
  function notVerified(res: NextApiResponse) {
    const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${`${endpointProd}/farconcert/verify.png`}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content="${endpointProd}/api/farconcert"
                  />
                  <meta name="fc:frame:button:1" content="Purchase Ticket" />
                  <meta property="fc:frame:button:1:action" content="tx" />
                  <meta
                    name="fc:frame:button:1:target"
                    content="${endpointProd}/api/farconcert"
                  />
                  `;
    res.setHeader("Content-Type", "text/html");

    res.status(200).send(htmlContent);
  }
}

async function goingToFarconcert(address: string) {
  const numOwned = (await BASEpublicServerClient.readContract({
    address: ticketContractAddress,
    abi: FarconcertTicket,
    functionName: "balanceOf",
    args: [address],
  })) as number;
  return numOwned >= 1;
}
