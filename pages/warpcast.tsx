import { useState } from "react";
import { NextPage } from "next";

const Warpcast: NextPage = () => {
  const [addresses, setAddresses] = useState("");
  const [values, setValues] = useState<Record<string, any>>({});

  const [message, setMessage] = useState("");

  function objectToCSV(data: { [s: string]: any } | ArrayLike<unknown>) {
    const csvRows = [];
    // Assuming your data is an object where each key is a row with an array of objects
    // And each object in the array has 'username' and 'fid' keys
    csvRows.push("WalletAddress,Username,FID"); // Header row
    Object.entries(data).forEach(([key, value]) => {
      value.forEach((val: { username: any; fid: any }) => {
        csvRows.push(`${key},${val.username},${val.fid}`);
      });
    });
    return csvRows.join("\n");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage("Loading...");

      const response = await (
        await fetch(`/api/warpcast/userInfo?addresses=${addresses}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
      ).json();
      setMessage("");
      setValues(response.data);

      // Convert the fetched data to CSV
      const csvData = objectToCSV(response.data);
      // Create a Blob with CSV data
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      // Create a temporary link to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "userInfo.csv"; // Name of the downloaded file
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error:", error.message);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h1>Get FIDs</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Addresses:
            <input
              type="text"
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">Get Info</button>
      </form>
      <br />
      <br />
      <br />
      {message && <p>{message}</p>}
      {Object.entries(values).map(([key, value]) => (
        <div key={key}>
          {key},{value[0].username},{value[0].fid}
        </div>
      ))}
    </div>
  );
};

export default Warpcast;
