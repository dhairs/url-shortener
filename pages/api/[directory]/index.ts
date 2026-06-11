import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import "../../../lib/firebase-admin"; // Ensures Admin SDK is initialized

type Data = {
  url: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { directory } = req.query;
  console.log(`Got request for flat slug: ${directory}`);

  try {
    const db = getFirestore();
    const docRef = db.collection("shortener").doc(`${directory}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() || {};
      
      // Increment count atomically on redirect
      await docRef.update({
        count: FieldValue.increment(1)
      });

      res.status(200).json({ url: data.url || "/" });
    } else {
      res.status(200).json({ url: "/" });
    }
  } catch (error) {
    console.error(`Error handling redirect for /${directory}:`, error);
    res.status(200).json({ url: "/" });
  }
}
