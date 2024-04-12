// pages/api/og.js

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import React from "react";

export const config = {
  runtime: "edge",
};

// TODO: Allow resets

// http://localhost:3000/api/og?image1=https://i.scdn.co/image/ab6761610000e5eb1fc195ac5c1868725eced009&image2=https://i.scdn.co/image/ab6761610000e5ebcd658b773fa2a841c5b1fe78&image3=https://i.scdn.co/image/ab6761610000e5eb810b04852e42d0f7932fb89c&name1=Boys%20Noize&name2=Daniel%20Allan&name3=NERO
// http://localhost:3001/api/og?image1={}&image2={}&image3={}
export default async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const image = searchParams.get("image") as string;

  const copy = searchParams.get("copy") as string;

  const hume = searchParams.get("hume") as string;

  console.log(copy);

  return new ImageResponse(
    (
      <div
        style={{
          fontFamily: "Monospace",
          fontSize: "80px",
          color: "white",
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          // boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Example drop shadow
        }}
      >
        <img
          width="100%"
          height="100%"
          style={{ margin: "0px", filter: "blur(40px)" }}
          src={image}
        />
        <div
          // src={"https://frames.boombox.fm/og/shine.png"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor:
              "rgba(0, 0, 0, 0.5)" /* Adjust the background color and opacity as needed */,

            filter: "blur(100px)" /* Adjust the blur intensity as needed */,
          }}
        />
        <img
          width="150px"
          height="120px"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            margin: "50px",
            // width: "100%",
            // height: "100%",
            // backgroundColor: "rgba(255, 255, 255, 0.5)", /* Adjust the background color and opacity as needed */

            // filter: "blur(50px)" /* Adjust the blur intensity as needed */,
          }}
          src={hume ? "" : "https://frames.cooprecords.xyz/crm.png"}
        />
        <div
          style={{
            position: "absolute",
            top: "0px",
            left: "0",
            width: "100%",
            height: "100%",
            display: "flex",
            marginTop: "0px",
            gap: "0px",
            flexDirection: "row", // Adjust as needed
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            style={{
              margin: "0px",
              width: "600",
              height: "600",
              borderRadius: "35px",
            }}
            src={image}
          />
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "800",
              height: "600",
              marginLeft: "100px",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "10px",
              overflow: "visible",
              whiteSpace: "preLine",
              // boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Example drop shadow
            }}
          >
            {copy.split("\\n").map((c) => {
              return (
                <>
                  {c}
                  <br />
                </>
              );
            })}
          </div>
        </div>
      </div>
    ),
    {
      width: 1910,
      height: 1000,
      // fonts: [
      //   {
      //     name: "sf",
      //     style: "normal",
      //     data: fontData,
      //   },
      // ],
    }
  );
}
