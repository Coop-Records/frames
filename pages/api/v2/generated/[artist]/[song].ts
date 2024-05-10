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
import { ButtonType, endpointProd } from "@/utils/constants";
import { ExecFileSyncOptionsWithBufferEncoding } from "child_process";

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
      .from("framesV2")
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
      await buttonFormation(
        entry,
        address,
        songContractAddress,
        publicServerClient,
        deployerAccount,
        walletClient,
        entry.data.button1Type,
        entry.data.button1Price,
        entry.data.button1link
      );
    } else if (req.body.untrustedData.buttonIndex === 2) {
      await buttonFormation(
        entry,
        address,
        songContractAddress,
        publicServerClient,
        deployerAccount,
        walletClient,
        entry.data.button2Type,
        entry.data.button2Price,
        entry.data.button2link
      );
    } else if (req.body.untrustedData.buttonIndex === 3) {
      await buttonFormation(
        entry,
        address,
        songContractAddress,
        publicServerClient,
        deployerAccount,
        walletClient,
        entry.data.button3Type,
        entry.data.button3Price,
        entry.data.button3link
      );
    } else {
      successMintScreen(
        res,
        entry.data.artist_name,
        entry.data.song_name,
        entry.data.image_url,
        entry
      );
    }
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

  async function buttonFormation(
    entry: any,
    address: `0x${string}`,
    songContractAddress: `0x${string}`,
    publicServerClient: PublicClient,
    deployerAccount: PrivateKeyAccount,
    walletClient: WalletClient,
    buttonType: ButtonType,
    buttonPrice: string,
    link: string
  ) {
    if (buttonType === "sponsoredfree" || buttonType === "sponsoredlimited") {
      await sponsoredMint(
        address,
        songContractAddress,
        publicServerClient,
        deployerAccount,
        entry,
        walletClient,
        buttonType,
        buttonPrice
      );
    } else if (buttonType === "link") {
      res.redirect(302, link);
      res.statusCode = 302;
      res.setHeader("location", link);
      res.end();
    } else {
      await txMint(
        address,
        songContractAddress,
        buttonType,
        entry.data.chain,
        buttonPrice,
        entry.data.superminteroverride
      );
    }
  }

  async function txMint(
    address: `0x${string}`,
    songContractAddress: any,
    buttonType: ButtonType,
    chain: string,
    price: string,
    superMinter: string | undefined
  ) {
    const mintHex = await getMintHex(
      address,
      songContractAddress,
      buttonType === "open"
    );
    res.status(200).json({
      chainId: `eip155:${chain === "base" ? "8453" : "10"}`,
      method: "eth_sendTransaction",
      attribution: false,
      params: {
        abi: SuperMinter, // JSON ABI of the function selector and any errors
        to: superMinter || superMinterContractAddress,
        data: mintHex,
        value: (parseEther("0.000777") + parseEther(price)).toString(),
      },
    });
  }

  async function sponsoredMint(
    address: `0x${string}`,
    songContractAddress: any,
    publicServerClient: PublicClient,
    deployerAccount: PrivateKeyAccount,
    entry: any,
    walletClient: WalletClient,
    buttonType: ButtonType,
    buttonPrice: string
  ) {
    if (
      await isMintingSoldOut(
        address,
        songContractAddress,
        publicServerClient,
        deployerAccount,
        buttonType === "sponsoredfree" || buttonType === "open",
        buttonPrice
      )
    ) {
      soldoutScreen(
        res,
        entry.data.artist_name,
        entry.data.song_name,
        entry.data.image_url,
        entry
      );
    } else if (
      await didUserAlreadyMint(address, songContractAddress, publicServerClient)
    ) {
      alreadyMintedScreen(
        res,
        entry.data.artist_name,
        entry.data.song_name,
        entry.data.image_url,
        entry
      );
    } else {
      try {
        await mintSong(
          address,
          songContractAddress,
          publicServerClient,
          deployerAccount,
          walletClient,
          buttonType === "open" || buttonType === "sponsoredfree",
          buttonPrice
        );
        successScreen(
          res,
          entry.data.artist_name,
          entry.data.song_name,
          entry.data.image_url,
          entry
        );
      } catch (e) {
        soldoutScreen(
          res,
          entry.data.artist_name,
          entry.data.song_name,
          entry.data.image_url,
          entry
        );
      }
    }
  }
}

function successMintScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string,
  entry: any
) {
  const image = `${endpointProd}/api/generated/og/mint?hume=${entry.data.humeLogo}&image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nCongrats! You have minted successfully.`;

  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content=${endpointProd}/api/v2/generated/${entry.data.artist_smash}/${entry.data.song_smash}
                  />
                  `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function successScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string,
  entry: any
) {
  const image = `${endpointProd}/api/generated/og/mint?hume=${entry.data.humeLogo}&image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nCongrats! Free edition claimed.`;

  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content=${endpointProd}/api/v2/generated/${entry.data.artist_smash}/${entry.data.song_smash}
                  />
                  `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function alreadyMintedScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string,
  entry: any
) {
  const image = `${endpointProd}/api/generated/og/mint?hume=${entry.data.humeLogo}&image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nYou have already collected.`;

  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content=${endpointProd}/api/v2/generated/${
    entry.data.artist_smash
  }/${entry.data.song_smash}
                  />
                  ${FCButton(
                    1,
                    entry.data.button1Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  ${FCButton(
                    2,
                    entry.data.button2Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  ${FCButton(
                    3,
                    entry.data.button3Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function soldoutScreen(
  res: NextApiResponse,
  artist: string,
  song: string,
  imageUrl: string,
  entry: any
) {
  const image = `${endpointProd}/api/generated/og/mint?hume=${entry.data.humeLogo}&image=${imageUrl}&copy=${artist}\\n \\n${song}\\n \\nFree Claim Sold Out`;

  const htmlContent = `
                  <meta name="description" content="Coop Recs Frame" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta name="fc:frame" content="vNext" />
                  <meta name="fc:frame:image" content="${image}" />
                  <meta name="og:image" content="op.png" />
                  <meta
                    name="fc:frame:post_url"
                    content=${endpointProd}/api/v2/generated/${
    entry.data.artist_smash
  }/${entry.data.song_smash}
                  />
                  ${FCButton(
                    1,
                    entry.data.button1Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  ${FCButton(
                    2,
                    entry.data.button2Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  ${FCButton(
                    3,
                    entry.data.button3Type,
                    entry.data.artist_smash,
                    entry.data.song_smash
                  )}
                  `;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}

function FCButton(
  index: number,
  buttonType: ButtonType,
  artist: string,
  song: string
): string {
  switch (buttonType) {
    case "limited":
      return `
          <meta name=fc:frame:button:${index} content="Buy Limited" />
          <meta property=fc:frame:button:${index}:action content="tx" />
          <meta
            name=fc:frame:button:${index}:target
            content=${endpointProd}/api/v2/generated/${artist}/${song}
          />
        `;
    case "open":
      return `
          <meta name=fc:frame:button:${index} content="Buy Unlimited" />
          <meta property=fc:frame:button:${index}:action content="tx" />
          <meta
            name=fc:frame:button:${index}:target
            content=${endpointProd}/api/v2/generated/${artist}/${song}
          />
        `;
    case "sponsoredfree":
      return `<meta name=fc:frame:button:${index} content="Retry Free Claim" />`;
    case "sponsoredlimited":
      return `<meta name=fc:frame:button:${index} content="Retry Free Claim" />`;
    case "link":
      return `
      <meta name="fc:frame:button:${index}" content="Listen" />
      <meta name="fc:frame:button:${index}:action" content="post_redirect" />
      `;
    case "none":
      return ``;
  }
  return "";
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
  isOpen: boolean,
  price: string
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
      value: parseEther(price) + parseEther("0.000777"),
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
  console.log("OWNED", owned);
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
  isOpen: boolean,
  price: string
) {
  const abi = SuperMinter;

  console.log("price", price);

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
    value: parseEther(price) + parseEther("0.000777"),
  });

  const hash = await walletClient.writeContract(request);

  return {
    hash,
    result,
  };
}
