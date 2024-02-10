// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  BASEpublicServerClient,
  BASEwalletClient,
  DeployerAccount,
} from "@/utils/client";
import type { NextApiRequest, NextApiResponse } from "next";
import SuperMinter from "@/abis/superminter.json";
import Song from "@/abis/song.json";
import { parseEther } from "viem";

type Data = {
  name: string;
};

const superMinterContractAddress = "0x000000000001A36777f9930aAEFf623771b13e70";
const songContractAddress1 = "0x8C6385f79200Afed5946Abb1Fa6dEC62cf656153";
const songContractAddress2 = "0x0043a2C44336f4Af576df0B16bB0799E08C78088";
const songContractAddress3 = "0x7Cf1ca780197B0607D4713b090b9b810FC02EEaE";

const endpointLocal =
  "https://e623-2601-645-8a00-9db0-b5aa-f69a-f69-7ac2.ngrok-free.app";
const endpointProd = "https://frames.cooprecords.xyz";

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

    console.log("HERE1");
    if (req.body.untrustedData.buttonIndex === 4) {
      res.redirect(302, "https://warpcast.com/~/channel/coop-recs");
      res.statusCode = 302;
      res.setHeader("location", "https://warpcast.com/~/channel/coop-recs");
      res.end();
    } else {
      if (!(await isFollowingChannel(userFid, "coop-recs"))) {
        followScreen(res);
      } else if (await isMintingSoldOut(address)) {
        soldoutScreen(res);
      } else if (await didUserAlreadyMint(address)) {
        alreadyMintedScreen(res);
      } else if (req.body.untrustedData.buttonIndex === 1) {
        await mintSong(address, songContractAddress1);
        successScreen(res);
      } else if (req.body.untrustedData.buttonIndex === 2) {
        await mintSong(address, songContractAddress2);
        successScreen(res);
      } else if (req.body.untrustedData.buttonIndex === 3) {
        await mintSong(address, songContractAddress3);
        successScreen(res);
      }
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
          <meta name="fc:frame:image" content=${endpointProd}/mint3/success.png />
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
          <meta name="fc:frame:image" content=${endpointProd}/mint3/alreadycollected.png />
          <meta name="og:image" content="op.png" />
        `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function followScreen(res: NextApiResponse) {
  const htmlContent = `
            <meta name="description" content="Coop Recs Frame" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="fc:frame" content="vNext" />
            <meta name="fc:frame:image" content=${endpointProd}/mint3/follow.png />
            <meta name="fc:frame:button:1" content="LACE" />
            <meta name="fc:frame:button:2" content="GLOW" />
            <meta name="fc:frame:button:3" content="Naked Love" />
            <meta name="fc:frame:button:4" content="Follow /coop-recs" />
            <meta name="fc:frame:button:4:action" content="post_redirect" />
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
          <meta name="fc:frame:image" content=${endpointProd}/mint3/soldout.png />
          <meta name="og:image" content="op.png" />
        `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
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

async function isMintingSoldOut(
  mintToAddress: `0x${string}`
): Promise<boolean> {
  try {
    console.log(mintToAddress);
    const { request, result } = await BASEpublicServerClient.simulateContract({
      address: superMinterContractAddress,
      abi: SuperMinter,
      functionName: "mintTo",
      args: [
        [
          songContractAddress1,
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
    console.log("SHOULD BE SOLD OUT");
    // console.log(e);
    return true;
  }
  return false;
}
async function didUserAlreadyMint(
  mintToAddress: `0x${string}`
): Promise<boolean> {
  let owned = (await BASEpublicServerClient.readContract({
    address: songContractAddress1,
    abi: Song,
    functionName: "tokensOfOwner",
    args: [mintToAddress],
  })) as number[];
  for (let i = 0; i < owned.length; i++) {
    if (owned[i] > 61) return true;
  }

  owned = (await BASEpublicServerClient.readContract({
    address: songContractAddress2,
    abi: Song,
    functionName: "tokensOfOwner",
    args: [mintToAddress],
  })) as number[];
  for (let i = 0; i < owned.length; i++) {
    if (owned[i] > 85) return true;
  }

  owned = (await BASEpublicServerClient.readContract({
    address: songContractAddress3,
    abi: Song,
    functionName: "tokensOfOwner",
    args: [mintToAddress],
  })) as number[];
  for (let i = 0; i < owned.length; i++) {
    if (owned[i] > 100) return true;
  }
  return false;
}

async function mintSong(
  mintToAddress: `0x${string}`,
  songContractAddress: string
) {
  const abi = SuperMinter;

  const { request, result } = await BASEpublicServerClient.simulateContract({
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

  const hash = await BASEwalletClient.writeContract(request);

  return {
    hash,
    result,
  };
}
