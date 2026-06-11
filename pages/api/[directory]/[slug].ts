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
  const { slug, directory } = req.query;
  console.log(`Got request for nested slug: ${directory}/${slug}`);

  try {
    const db = getFirestore();
    
    // Nested slugs map to "directory:slug" in the flat shortener collection
    const docId = `${directory}:${slug}`;
    const docRef = db.collection("shortener").doc(docId);
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
    console.error(`Error handling redirect for /${directory}/${slug}:`, error);
    res.status(200).json({ url: "/" });
  }
}
