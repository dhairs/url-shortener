// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { doc, getDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import firestore from "../../../bin/firebase";
type Data = {
  url: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { slug, directory } = req.query;
  const docRef = doc(firestore, `${directory}`, `${slug}`);
  var docData = await getDoc(docRef);
  if (docData.exists()) {
    res.status(200).json({ url: docData.data().url });
    var newData = docData.data();

    // how many times it was used
    if (newData.count) {
      newData.count += 1;
    } else {
      newData.count = 0;
    }
  } else {
    res.status(200).json({ url: "/" });
  }
}
