// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import SuperMinter from "@/abis/superminter.json";
import Song from "@/abis/song.json";
import {
  PrivateKeyAccount,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { supabase } from "@/lib/supabaseClient";
import { isEmpty, isNil } from "lodash";
import { privateKeyToAccount } from "viem/accounts";
import { base, optimism } from "viem/chains";
import { endpointProd } from "@/utils/constants";

const superMinterContractAddress = "0x000000000001A36777f9930aAEFf623771b13e70";

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
    const { artist, song } = req.query;
    const entry = await supabase
      .from("frames")
      .select("*")
      .eq("artist_smash", artist)
      .eq("song_smash", song)
      .single();
    const songContractAddress = entry.data.contract_address;

    const deployerAccount = privateKeyToAccount(
      `${entry.data.private_key as `0x${string}`}`
    );
    const publicServerClient = createPublicClient({
      chain: entry.data.chain === "base" ? base : optimism,
      transport: http(entry.data.chain === "base" ? baseUrl : opUrl),
    });
    const walletClient = createWalletClient({
      chain: entry.data.chain === "base" ? base : optimism,
      transport: http(entry.data.chain === "base" ? baseUrl : opUrl),
      account: deployerAccount,
    });

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
      const mintHex = await getMintHex(
        address,
        songContractAddress,
        entry.data.paid_edition === "open"
      );
      res.status(200).json({
        chainId: `eip155:${entry.data.chain === "base" ? "8453" : "10"}`,
        method: "eth_sendTransaction",
        attribution: false,
        params: {
          abi: SuperMinter, // JSON ABI of the function selector and any errors
          to: superMinterContractAddress,
          data: mintHex,
          value: (
            parseEther("0.000777") + parseEther(entry.data.paid_edition_price)
          ).toString(),
        },
      });
    } else if (
      req.body.untrustedData.buttonIndex === 3 &&
      !isEmpty(entry.data.button_2)
    ) {
      const button = entry.data.button_2;
      handleButtons(button, res);
      res.end();
    } else if (
      req.body.untrustedData.buttonIndex === 4 &&
      !isEmpty(entry.data.button_3)
    ) {
      const button = entry.data.button_3;
      handleButtons(button, res);
      res.end();
    } else {
      if (
        !(await isFollowing(
          userFid,
          [entry.data.button_2, entry.data.button_3, entry.data.button_4],
          [
            entry.data.button_fid_2,
            entry.data.button_fid_3,
            entry.data.button_fid_4,
          ]
        ))
      ) {
        followScreen(
          res,
          [entry.data.button_2, entry.data.button_3, entry.data.button_4],
          entry.data.artist_name,
          entry.data.song_name,
          entry.data.image_url
        );
      } else if (
        await isMintingSoldOut(
          address,
          songContractAddress,
          publicServerClient,
          deployerAccount,
          entry.data.edition === "open"
        )
      ) {
        soldoutScreen(
          res,
          entry.data.artist_name,
          entry.data.song_name,
          entry.data.image_url
        );
      } else if (
        await didUserAlreadyMint(
          address,
          songContractAddress,
          publicServerClient
        )
      ) {
        alreadyMintedScreen(
          res,
          entry.data.artist_name,
          entry.data.song_name,
          entry.data.image_url
        );
      } else {
        try {
          await mintSong(
            address,
            songContractAddress,
            publicServerClient,
            deployerAccount,
            walletClient,
            entry.data.edition === "open"
          );
          successScreen(
            res,
            entry.data.artist_name,
            entry.data.song_name,
            entry.data.image_url
          );
        } catch (e) {
          soldoutScreen(
            res,
            entry.data.artist_name,
            entry.data.song_name,
            entry.data.image_url
          );
        }
      }
    }
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function handleButtons(button_2: any, res: NextApiResponse) {
  if (button_2[0] === "@") {
    res.redirect(302, `https://warpcast.com/${button_2.substring(1)}`);
    res.statusCode = 302;
    res.setHeader("location", `https://warpcast.com/${button_2.substring(1)}`);
  } else if (button_2[0] === "/") {
    res.redirect(
      302,
      `https://warpcast.com/~/channel/${button_2.substring(1)}`
    );
    res.statusCode = 302;
    res.setHeader(
      "location",
      `https://warpcast.com/~/channel/${button_2.substring(1)}`
    );
  }
}

function successScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string
) {
  const image = `${endpointProd}/api/generated/og/mint?image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nCongrats! Free edition claimed.`;
  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function alreadyMintedScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string
) {
  const image = `${endpointProd}/api/generated/og/mint?image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nYou have already collected.`;
  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function followScreen(
  res: NextApiResponse,
  buttons: string[],
  artist: string,
  song: string,
  imageUrl: string
) {
  const image = `${endpointProd}/api/generated/og/mint?image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nPlease follow:\\n \\n${buttons
    .filter((button) => !isEmpty(button))
    .join("\\n")}\\n \\nbefore collecting`;

  let buttonMetas = `
    <meta name="fc:frame:button:1" content="Buy Edition" />
    <meta property="fc:frame:button:1:action" content="tx" />
    <meta
      name="fc:frame:button:1:target"
      content=${endpointProd}/api/generated/${artist}/${song}
    />
    <meta name="fc:frame:button:2" content="Retry" />
  `;

  buttons.forEach((button, i) => {
    if (!isEmpty(button)) {
      buttonMetas += `
      <meta name="fc:frame:button:${i + 3}" content="Follow ${button}" />
      <meta name="fc:frame:button:${i + 3}:action" content="post_redirect" />
      `;
    }
  });

  const htmlContent = `
                    <meta name="description" content="Coop Recs Frame" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="fc:frame" content="vNext" />
                    <meta name="fc:frame:image" content="${image}" />
                    ${buttonMetas}
                    <meta name="og:image" content="op.png" />
                  `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function soldoutScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string
) {
  const image = `${endpointProd}/api/generated/og/mint?image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nSold Out`;

  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                  <meta name="fc:frame:button:1" content="Buy Edition" />
                  <meta property="fc:frame:button:1:action" content="tx" />
                  <meta
                    name="fc:frame:button:1:target"
                    content=${endpointProd}/api/generated/${artist}/${song}
                  />
                `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

async function isFollowing(
  fid: number,
  buttons: string[],
  buttonFids: string[]
): Promise<boolean> {
  const nonEmptyButtons = buttons.filter((button) => button !== "");

  const isFollowingPromises = nonEmptyButtons.map(async (button, i) => {
    if (button.startsWith("@")) {
      const followFid = buttonFids[i];
      const isFol = await isFollowingAccount(fid, Number(followFid));
      console.log("@", isFol);
      return isFol;
    } else if (button.startsWith("/")) {
      const isFol = await isFollowingChannel(fid, button.slice(1));
      console.log("/", isFol);
      return isFol;
    } else {
      return false;
    }
  });
  const results = await Promise.all(isFollowingPromises);
  const isFollowing = results.every((result) => result);

  return isFollowing;
}

async function isFollowingAccount(
  fid: number,
  followFid: number
): Promise<boolean> {
  `https://api.neynar.com/v1/farcaster/user`;
  const response = await (
    await fetch(
      `https://api.neynar.com/v1/farcaster/user?fid=${followFid}&viewerFid=${fid}`,
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
      return true;
    }

    if (data?.next?.cursor === undefined) {
      break;
    } else {
      cursor = data.next.cursor;
    }
  }

  return false;
}

async function getMintHex(
  mintToAddress: `0x${string}`,
  songContractAddress: `0x${string}`,
  isOpen: boolean
): Promise<`0x${string}` | undefined> {
  try {
    const data = encodeFunctionData({
      abi: SuperMinter,
      functionName: "mintTo",
      args: [
        [
          songContractAddress,
          isOpen ? 0 : 1,
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
          "0x512b55b00d744fC2eDB8474f223a7498c3e5a7ce", // address (affiliate, empty)
          [], // bytes32[] (affiliateProof, empty)
          0, // uint256 (attributionId, default as string)
        ],
      ],
    });
    return data;
  } catch (e) {
    console.log(e);
  }
  return undefined;
}

async function isMintingSoldOut(
  mintToAddress: `0x${string}`,
  songContractAddress: `0x${string}`,
  publicServerClient: PublicClient,
  DeployerAccount: PrivateKeyAccount,
  isOpen: boolean
): Promise<boolean> {
  try {
    const { request, result } = await publicServerClient.simulateContract({
      address: superMinterContractAddress,
      abi: SuperMinter,
      functionName: "mintTo",
      args: [
        [
          songContractAddress,
          isOpen ? 0 : 1,
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
          "0x512b55b00d744fC2eDB8474f223a7498c3e5a7ce", // address (affiliate, empty)
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
  mintToAddress: `0x${string}`,
  songContractAddress: `0x${string}`,
  publicServerClient: PublicClient
): Promise<boolean> {
  // cutoff is id 1461
  const cutoff = 0;
  const owned = (await publicServerClient.readContract({
    address: songContractAddress,
    abi: Song,
    functionName: "tokensOfOwner",
    args: [mintToAddress],
  })) as number[];
  for (let i = 0; i < owned.length; i++) {
    if (owned[i] > cutoff) return true;
  }
  return false;
}

async function mintSong(
  mintToAddress: `0x${string}`,
  songContractAddress: `0x${string}`,
  publicServerClient: PublicClient,
  DeployerAccount: PrivateKeyAccount,
  walletClient: WalletClient,
  isOpen: boolean
) {
  const abi = SuperMinter;

  const { request, result } = await publicServerClient.simulateContract({
    address: superMinterContractAddress,
    abi: SuperMinter,
    functionName: "mintTo",
    args: [
      [
        songContractAddress,
        isOpen ? 0 : 1,
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
        "0x512b55b00d744fC2eDB8474f223a7498c3e5a7ce", // address (affiliate, empty)
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
