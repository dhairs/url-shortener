import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let isAdminInitialized = false;

export function getAdminAuth() {
  const apps = getApps();
  let adminApp = apps.find(app => app.name === "admin-app");
  if (!adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Robust cleaning of Vercel/env private keys
      let cleanPrivateKey = privateKey.trim();
      
      // Remove outer single/double quotes, including escaped quotes
      cleanPrivateKey = cleanPrivateKey.replace(/^\\?['"]|\\?['"]$/g, "");
      
      // Replace literal '\n' or '\\n' strings with actual newline characters
      cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, "\n");
      
      // Ensure it starts and ends correctly
      if (!cleanPrivateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
        console.warn("Private key does not start with standard PEM header.");
      }

      console.log("Firebase Admin Cert Info:");
      console.log(`- Project ID: ${projectId}`);
      console.log(`- Client Email: ${clientEmail}`);
      console.log(`- Key Length: ${cleanPrivateKey.length} characters`);
      console.log(`- Key Start: "${cleanPrivateKey.substring(0, 35)}..."`);
      console.log(`- Key End: "...${cleanPrivateKey.substring(cleanPrivateKey.length - 35)}"`);

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: cleanPrivateKey,
        }),
      }, "admin-app");
      isAdminInitialized = true;
      console.log("Firebase Admin SDK initialized successfully in named admin-app.");
    } else {
      throw new Error("Firebase Service Account credentials not fully set. Admin SDK not initialized.");
    }
  } else {
    isAdminInitialized = true;
  }
  return getAuth(adminApp);
}

export function isInitialized() {
  return isAdminInitialized || getApps().some(app => app.name === "admin-app");
}
