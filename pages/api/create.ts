import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "../../lib/firebase-admin";
import firestore from "../../bin/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
      return res.status(403).json({ error: "Access Denied: You are not authorized to create links" });
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

    // Determine collection and document ID
    let collectionName = "slugs";
    let docId = trimmedSlug;

    if (trimmedSlug.includes("/")) {
      const parts = trimmedSlug.split("/");
      if (parts.length === 2) {
        collectionName = parts[0].trim();
        docId = parts[1].trim();
      } else {
        return res.status(400).json({ error: "Slug can contain at most one slash (e.g. folder/slug)" });
      }
    }

    if (!docId) {
      return res.status(400).json({ error: "Invalid slug format" });
    }

    // Check if slug already exists to prevent silent overwrite
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return res.status(409).json({ error: `Slug '${trimmedSlug}' already exists` });
    }

    // Write link to Firestore
    await setDoc(docRef, {
      url: trimmedUrl,
      count: 0,
      createdAt: new Date().toISOString(),
      createdBy: email
    });

    return res.status(200).json({ status: "success", slug: trimmedSlug, url: trimmedUrl });
  } catch (error: any) {
    console.error("Link creation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to create short URL" });
  }
}
