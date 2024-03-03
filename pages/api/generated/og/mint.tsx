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
  const image =
    "https://d2i9ybouka0ieh.cloudfront.net/artist-uploads/0f524dab-4861-4eb6-aa51-86a3911b9e42/RELEASE_COVER_IMAGE/8423404-newImage.png"; //searchParams.get("image") as string;

  // const fontData = await fetch(
  //   new URL("https://frames.cooprecords.xyz/sf.otf", import.meta.url)
  // ).then((res) => res.arrayBuffer());
  const copy = searchParams.get("copy") as string;
  const copyWithLineBreaks = copy.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
  console.log(copy);

  return new ImageResponse(
    (
      <div
        style={{
          fontFamily: "Monospace",
          fontSize: "60px",
          color: "white",
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: "10px",
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
            // backgroundColor: "rgba(255, 255, 255, 0.5)", /* Adjust the background color and opacity as needed */

            filter: "blur(50px)" /* Adjust the blur intensity as needed */,
          }}
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
              marginLeft: "20px",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "10px",
              overflow: "hidden",
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