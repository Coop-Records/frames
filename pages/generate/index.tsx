import { useState } from "react";
import { NextPage } from "next";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { supabase } from "@/lib/supabaseClient";
import { isEmpty } from "lodash";

const AddSongPage: NextPage = () => {
  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [button2, setButton2] = useState("");
  const [button3, setButton3] = useState("");
  const [button4, setButton4] = useState("");
  const [buttonFid2, setButtonLabel2] = useState("");
  const [buttonFid3, setButtonLabel3] = useState("");
  const [buttonFid4, setButtonLabel4] = useState("");
  const [contractAddress, setContractAddress] = useState("");

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

      if (button2.startsWith("@") && isEmpty(buttonFid2)) {
        throw Error("Provide a FID for Button 2");
      } else if (button3.startsWith("@") && isEmpty(buttonFid3)) {
        throw Error("Provide a FID for Button 3");
      } else if (button4.startsWith("@") && isEmpty(buttonFid4)) {
        throw Error("Provide a FID for Button 4");
      } else if (isEmpty(artistName)) {
        throw Error("Provide an artist name");
      } else if (isEmpty(songName)) {
        throw Error("Provide an song name");
      } else if (isEmpty(imageUrl)) {
        throw Error("Provide an image url");
      } else if (isEmpty(contractAddress)) {
        throw Error("Provide a contract address");
      }

      const actualUrl = getUrlParameterValue(imageUrl);

      const { data, error } = await supabase.from("frames").insert([
        {
          artist_name: artistName,
          song_name: songName,
          image_url: actualUrl,
          button_2: button2,
          button_3: button3,
          button_4: button4,
          button_fid_2: buttonFid2,
          button_fid_3: buttonFid3,
          button_fid_4: buttonFid4,
          contract_address: contractAddress,
          wallet_address: account.address,
          private_key: privateKey,
        },
      ]);

      setMessage(
        `Song added successfully!\nFund Wallet Address: ${account.address}`
      );
      setArtistName("");
      setSongName("");
      setImageUrl("");
      setButton2("");
      setButton3("");
      setButton4("");
      setContractAddress("");
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
            Button 2:
            <input
              type="text"
              value={button2}
              onChange={(e) => setButton2(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 3:
            <input
              type="text"
              value={button3}
              onChange={(e) => setButton3(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 4:
            <input
              type="text"
              value={button4}
              onChange={(e) => setButton4(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 2 FID (if following account):
            <input
              type="text"
              value={buttonFid2}
              onChange={(e) => setButtonLabel2(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 3 FID (if following account):
            <input
              type="text"
              value={buttonFid3}
              onChange={(e) => setButtonLabel3(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Button 4 FID (if following account):
            <input
              type="text"
              value={buttonFid4}
              onChange={(e) => setButtonLabel4(e.target.value)}
            />
          </label>
        </div>
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