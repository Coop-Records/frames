import { useState } from "react";
import { NextPage } from "next";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { supabase } from "@/lib/supabaseClient";
import { isEmpty } from "lodash";
import { ButtonType } from "@/utils/constants";

const AddSongPage: NextPage = () => {
  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [button1Type, setButton1Type] = useState<ButtonType>("none");
  const [button2Type, setButton2Type] = useState<ButtonType>("none");
  const [button3Type, setButton3Type] = useState<ButtonType>("none");
  const [contractAddress, setContractAddress] = useState("");
  const [chain, setChain] = useState("base"); // Default chain selection
  const [button1Price, setButton1Price] = useState("0");
  const [button2Price, setButton2Price] = useState("0");
  const [button3Price, setButton3Price] = useState("0");
  const [button1Link, setButton1Link] = useState("");
  const [button2Link, setButton2Link] = useState("");
  const [button3Link, setButton3Link] = useState("");
  const [superminteroverride, setSuperMinterOverride] = useState<
    string | undefined
  >(undefined);

  const [message, setMessage] = useState("");

  function getUrlParameterValue(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("url");
    } catch (error: any) {
      console.error("Error parsing URL:", error.message);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      if (isEmpty(artistName)) {
        throw Error("Provide an artist name");
      } else if (isEmpty(songName)) {
        throw Error("Provide an song name");
      } else if (isEmpty(imageUrl)) {
        throw Error("Provide an image url");
      } else if (isEmpty(contractAddress)) {
        throw Error("Provide a contract address");
      } else if (button1Type !== "none" && isEmpty(button1Price)) {
        throw Error("Provide valid purchase price");
      } else if (button2Type !== "none" && isEmpty(button2Price)) {
        throw Error("Provide valid purchase price");
      } else if (button3Type !== "none" && isEmpty(button3Price)) {
        throw Error("Provide valid purchase price");
      } else if (
        button1Type === "none" &&
        (button2Type !== "none" || button3Type !== "none")
      ) {
        throw Error("You can not have higher buttons listed as none");
      } else if (button2Type === "none" && button3Type !== "none") {
        throw Error("You can not have higher buttons listed as none");
      }
      const actualUrl = getUrlParameterValue(imageUrl);

      const { data: query, error: queryError } = await supabase
        .from("framesV2")
        .select("id, wallet_address")
        .eq("artist_smash", artistName.replaceAll(" ", ""))
        .eq("song_smash", songName.replaceAll(" ", ""))
        .single();

      if (query) {
        const { data, error } = await supabase
          .from("framesV2")
          .update([
            {
              artist_name: artistName,
              song_name: songName,
              song_smash: songName.replaceAll(" ", ""),
              artist_smash: artistName.replaceAll(" ", ""),
              image_url: actualUrl,
              contract_address: contractAddress,
              chain,
              button1Price,
              button1Type,
              button2Price,
              button2Type,
              button3Price,
              button3Type,
              button1link: button1Link,
              button2link: button2Link,
              button3link: button3Link,
            },
          ])
          .eq("id", query.id)
          .single();

        console.log(data);
        console.log(error);
        setMessage(
          `Song added successfully!\nFund Wallet Address: ${
            query.wallet_address
          }. The frame address is: https://frames.cooprecords.xyz/generate/v2/${artistName.replaceAll(
            " ",
            ""
          )}/${songName.replaceAll(" ", "")}`
        );
      } else {
        const { data, error } = await supabase.from("framesV2").insert([
          {
            artist_name: artistName,
            song_name: songName,
            song_smash: songName.replaceAll(" ", ""),
            artist_smash: artistName.replaceAll(" ", ""),
            image_url: actualUrl,
            contract_address: contractAddress,
            wallet_address: account.address,
            private_key: privateKey,
            chain,
            button1Price,
            button1Type,
            button2Price,
            button2Type,
            button3Price,
            button3Type,
            button1link: button1Link,
            button2link: button2Link,
            button3link: button3Link,
          },
        ]);
        setMessage(
          `Song added successfully!\nFund Wallet Address: ${
            account.address
          }. The frame address is: https://frames.cooprecords.xyz/generate/v2/${artistName.replaceAll(
            " ",
            ""
          )}/${songName.replaceAll(" ", "")}`
        );
      }

      setArtistName("");
      setSongName("");
      setImageUrl("");
      setButton1Price("0");
      setButton2Price("0");
      setButton3Price("0");
      setButton1Type("none");
      setButton2Type("none");
      setButton3Type("none");
      setContractAddress("");
      setButton1Link("");
      setButton2Link("");
      setButton3Link("");
    } catch (error: any) {
      console.error("Error adding song:", error.message);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h1>Add a Song</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Artist Name:
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Song Name:
            <input
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Image URL:
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 1 Type:
            <select
              value={button1Type}
              onChange={(e) => setButton1Type(e.target.value as ButtonType)}
            >
              <option value="limited">TX Limited</option>
              <option value="open">TX Forever</option>
              <option value="sponsoredfree">Sponsored Free</option>
              <option value="sponsoredlimited">Sponsored Limited</option>{" "}
              <option value="link">Link</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        {button1Type === "link" ? (
          <div>
            <label>
              Button 1 Link:
              <input
                type="text"
                value={button1Link}
                onChange={(e) => setButton1Link(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div>
            <label>
              Button 1 Price:
              <input
                type="text"
                value={button1Price}
                onChange={(e) => setButton1Price(e.target.value)}
              />
            </label>
          </div>
        )}
        <div>
          <label>
            Button 2 Type:
            <select
              value={button2Type}
              onChange={(e) => setButton2Type(e.target.value as ButtonType)}
            >
              <option value="limited">TX Limited</option>
              <option value="open">TX Forever</option>
              <option value="sponsoredfree">Sponsored Free</option>
              <option value="sponsoredlimited">Sponsored Limited</option>{" "}
              <option value="link">Link</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        {button2Type === "link" ? (
          <div>
            <label>
              Button 2 Link:
              <input
                type="text"
                value={button2Link}
                onChange={(e) => setButton2Link(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div>
            <label>
              Button 2 Price:
              <input
                type="text"
                value={button2Price}
                onChange={(e) => setButton2Price(e.target.value)}
              />
            </label>
          </div>
        )}
        <div>
          <label>
            Button 3 Type:
            <select
              value={button3Type}
              onChange={(e) => setButton3Type(e.target.value as ButtonType)}
            >
              <option value="limited">TX Limited</option>
              <option value="open">TX Forever</option>
              <option value="sponsoredfree">Sponsored Free</option>
              <option value="sponsoredlimited">Sponsored Limited</option>
              <option value="link">Link</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        {button3Type === "link" ? (
          <div>
            <label>
              Button 3 Link:
              <input
                type="text"
                value={button3Link}
                onChange={(e) => setButton3Link(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div>
            <label>
              Button 3 Price:
              <input
                type="text"
                value={button3Price}
                onChange={(e) => setButton3Price(e.target.value)}
              />
            </label>
          </div>
        )}
        <div>
          <label>
            Contract Address:
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Super Minter Override (Used for old contracts):
            <input
              type="text"
              value={superminteroverride}
              onChange={(e) =>
                setSuperMinterOverride(
                  e.target.value === "" ? undefined : e.target.value
                )
              }
            />
          </label>
        </div>
        <div>
          <label>
            Chain:
            <select value={chain} onChange={(e) => setChain(e.target.value)}>
              <option value="base">Base</option>
              <option value="optimism">Optimism</option>
            </select>
          </label>
        </div>
        <button type="submit">Add Song</button>
      </form>
      <br />
      <br />
      <br />
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddSongPage;
