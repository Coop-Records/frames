// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const htmlContent = `
  <meta name="description" content="Coop Recs Frame" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content="https://framerusercontent.com/images/6XDWIpF2bWm2Z9TzNiJlbayc8bA.png" />
  <meta name="og:image" content="https://framerusercontent.com/images/6XDWIpF2bWm2Z9TzNiJlbayc8bA.png" />
  <meta name="fc:frame:post_url" content="https://mintnft.vercel.app/" />
`;
  res.setHeader("Content-Type", "text/html");

  res.status(200).send(htmlContent);
}
