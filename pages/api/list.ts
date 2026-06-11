import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "../../lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const sessionCookie = req.cookies.__session;
  if (!sessionCookie) {
    return res.status(401).json({ error: "Unauthorized: No session cookie found" });
  }

  try {
    // 1. Verify Authentication
    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // 2. Verify Authorization
    const email = decodedClaims.email || "";
    const allowedEmail = process.env.ALLOWED_ADMIN_EMAIL || "";
    const isAuthorized = email.toLowerCase() === allowedEmail.toLowerCase() && allowedEmail !== "";

    if (!isAuthorized) {
      return res.status(403).json({ error: "Access Denied: You are not authorized to view links" });
    }

    // 3. Fetch all collections & documents from Firestore
    const db = getFirestore();
    const collections = await db.listCollections();
    const links: any[] = [];

    for (const col of collections) {
      const snapshot = await col.get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const slug = col.id === "slugs" ? doc.id : `${col.id}/${doc.id}`;
        links.push({
          slug,
          url: data.url || "",
          count: data.count || 0,
          createdAt: data.createdAt || null,
          createdBy: data.createdBy || null,
        });
      });
    }

    // Sort links by creation date (newest first) or alphabetically by slug
    links.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.slug.localeCompare(b.slug);
    });

    return res.status(200).json({ status: "success", links });
  } catch (error: any) {
    console.error("Failed to list links:", error);
    return res.status(500).json({ error: error.message || "Failed to list shortened URLs" });
  }
}
