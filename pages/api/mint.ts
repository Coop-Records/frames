// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  DeployerAccount,
  OPpublicServerClient,
  walletClient,
} from "@/utils/client";
import type { NextApiRequest, NextApiResponse } from "next";
import SuperMinter from "@/abis/superminter.json";
import Song from "@/abis/song.json";
import { parseEther } from "viem";

type Data = {
  name: string;
};

const superMinterContractAddress = "0x000000000001A36777f9930aAEFf623771b13e70";
const songContractAddress = "0x482f34d9137f572397973a6dcf5266a697471824";

const endpointLocal =
  "https://dcd5-2601-645-8a00-9db0-4132-783f-3890-61af.ngrok-free.app";
const endpointProd = "https://frames.cooprecords.xyz";

// TODO: Implement redirect
// if (req.body.untrustedData.buttonIndex === 2) {
//   res.redirect(302, "https://sound.xyz");
//   res.statusCode = 302;
//   res.setHeader("location", "https://sound.xyz");
//   res.end();
// } else {

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const neynarApiKey: string = process.env.NEYNAR_ONCHAIN_KIT_API_KEY as string;

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

    if (await isMintingSoldOut(address)) {
      soldoutScreen(res);
    } else if (await didUserAlreadyMint(address)) {
      alreadyMintedScreen(res);
    } else {
      await mintSong(address);
      successScreen(res);
    }
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function successScreen(res: NextApiResponse) {
  const htmlContent = `
  <meta name="description" content="Coop Recs Frame" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content=${endpointProd}/success.png />
  <meta name="og:image" content="op.png" />
`;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function alreadyMintedScreen(res: NextApiResponse) {
  const htmlContent = `
  <meta name="description" content="Coop Recs Frame" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content=${endpointProd}/alreadycollected.png />
  <meta name="og:image" content="op.png" />
`;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function soldoutScreen(res: NextApiResponse) {
  const htmlContent = `
  <meta name="description" content="Coop Recs Frame" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content=${endpointProd}/soldout.png />
  <meta name="og:image" content="op.png" />
`;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

async function isMintingSoldOut(
  mintToAddress: `0x${string}`
): Promise<boolean> {
  try {
    console.log(mintToAddress);
    const { request, result } = await OPpublicServerClient.simulateContract({
      address: superMinterContractAddress,
      abi: SuperMinter,
      functionName: "mintTo",
      args: [
        [
          songContractAddress,
          1,
          0,
          mintToAddress,
          1,
          "0x0000000000000000000000000000000000000000", // address (allowlisted, empty)
          0, // uint32 (allowlistedQuantity, default)
          [], // bytes32[] (allowlistProof, empty)
          0, // uint96 (signedPrice, default)
          0, // uint32 (signedQuantity, default)
          0, // uint32 (signedClaimTicket, default)
          0, // uint32 (signedDeadline, default)
          "", // bytes (signature, empty)
          "0x0000000000000000000000000000000000000000", // address (affiliate, empty)
          [], // bytes32[] (affiliateProof, empty)
          0, // uint256 (attributionId, default as string)
        ],
      ],
      account: DeployerAccount,
      value: parseEther("0.000777"),
    });
  } catch (e) {
    console.log(e);
    return true;
  }
  return false;
}
async function didUserAlreadyMint(
  mintToAddress: `0x${string}`
): Promise<boolean> {
  // cutoff is id 1461
  const cutoff = 1464;
  const owned = (await OPpublicServerClient.readContract({
    address: songContractAddress,
    abi: Song,
    functionName: "tokensOfOwner",
    args: [mintToAddress],
  })) as number[];
  for (let i = 0; i < owned.length; i++) {
    console.log("HERE");
    if (owned[i] > cutoff) return true;
  }
  return false;
}

async function mintSong(mintToAddress: `0x${string}`) {
  const abi = SuperMinter;

  const { request, result } = await OPpublicServerClient.simulateContract({
    address: superMinterContractAddress,
    abi: SuperMinter,
    functionName: "mintTo",
    args: [
      [
        songContractAddress,
        1,
        0,
        mintToAddress,
        1,
        "0x0000000000000000000000000000000000000000", // address (allowlisted, empty)
        0, // uint32 (allowlistedQuantity, default)
        [], // bytes32[] (allowlistProof, empty)
        0, // uint96 (signedPrice, default)
        0, // uint32 (signedQuantity, default)
        0, // uint32 (signedClaimTicket, default)
        0, // uint32 (signedDeadline, default)
        "", // bytes (signature, empty)
        "0x0000000000000000000000000000000000000000", // address (affiliate, empty)
        [], // bytes32[] (affiliateProof, empty)
        0, // uint256 (attributionId, default as string)
      ],
    ],
    account: DeployerAccount,
    value: parseEther("0.000777"),
  });

  const hash = await walletClient.writeContract(request);

  return {
    hash,
    result,
  };
}
