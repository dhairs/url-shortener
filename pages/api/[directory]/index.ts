// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { headers } from "next/headers";
import firestore from "../../../bin/firebase";
type Data = {
  url: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { directory } = req.query;
  const docRef = doc(firestore, "slugs", `${directory}`);
  var docData = await getDoc(docRef);

  console.log(`Got request for ${directory}`);

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
