// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { doc, getDoc } from 'firebase/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'
import firestore from '../../../bin/firebase'
type Data = {
  url: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { directory } = req.query
  const docRef =  doc(firestore, 'slugs', `${directory}`);
  var docData = await getDoc(docRef);
  if (docData.exists()) {
    res.status(200).json({ url: docData.data().url })
  } else {
  res.status(200).json({ url: '/' })
  }
}
