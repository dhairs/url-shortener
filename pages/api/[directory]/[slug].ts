// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import firestore from "../../../bin/firebase";
import { headers } from "next/headers";
type Data = {
  url: string;
};

export function getIp() {
  let forwardedFor = headers().get("x-forwarded-for");
  let real = headers().get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (real) {
    return real.trim();
  }

  return "n/a";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { slug, directory } = req.query;
  const docRef = doc(firestore, `${directory}`, `${slug}`);
  var docData = await getDoc(docRef);

  console.log(`Got request for ${directory} from ${getIp()}`);

  if (docData.exists()) {
    var newData = docData.data();

    // how many times it was used
    if (newData.count != undefined && newData.count != null) {
      newData.count += 1;
    } else {
      newData.count = 0;
    }

    await updateDoc(docRef, newData);

    res.status(200).json({ url: docData.data().url });
  } else {
    res.status(200).json({ url: "/" });
  }
}
