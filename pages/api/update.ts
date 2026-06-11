import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "../../lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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
      return res.status(403).json({ error: "Access Denied: You are not authorized to update links" });
    }

    // 3. Process Request
    const { slug, url } = req.body;
    if (!slug || !url) {
      return res.status(400).json({ error: "Missing required fields: slug and url" });
    }

    let trimmedSlug = slug.trim();
    let trimmedUrl = url.trim();

    // Clean up slug (remove leading/trailing slashes)
    trimmedSlug = trimmedSlug.replace(/^\/+|\/+$/g, "");

    // Validate URL structure roughly
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return res.status(400).json({ error: "URL must start with http:// or https://" });
    }

    if (!trimmedSlug) {
      return res.status(400).json({ error: "Slug cannot be empty" });
    }

    // Document ID maps slug slashes to colons
    const docId = trimmedSlug.replace(/\//g, ":");

    // Check if slug exists in shortener collection
    const db = getFirestore();
    const docRef = db.collection("shortener").doc(docId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: `Redirect for slug '${trimmedSlug}' does not exist.` });
    }

    // Update destination URL in Firestore
    await docRef.update({
      url: trimmedUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: email
    });

    return res.status(200).json({ status: "success", slug: trimmedSlug, url: trimmedUrl });
  } catch (error: any) {
    console.error("Link update failed:", error);
    return res.status(500).json({ error: error.message || "Failed to update short URL" });
  }
}
