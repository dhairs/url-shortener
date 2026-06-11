import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let isAdminInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const apps = getApps();

  if (apps.length === 0) {
    if (projectId && clientEmail && privateKey) {
      const cleanPrivateKey = privateKey
        .replace(/\\n/g, "\n")
        .replace(/^['"]|['"]$/g, "");

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: cleanPrivateKey,
        }),
      });
      isAdminInitialized = true;
      console.log("Firebase Admin SDK initialized successfully with Service Account.");
    } else {
      console.log("Firebase Service Account credentials not fully set. Admin SDK not initialized.");
    }
  } else {
    isAdminInitialized = true;
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error);
}

export function getAdminAuth() {
  if (getApps().length === 0) {
    throw new Error("Firebase Admin SDK is not initialized. Check your environment variables.");
  }
  return getAuth();
}

export { isAdminInitialized };
