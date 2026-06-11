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
      const cleanPrivateKey = privateKey
        .replace(/\\n/g, "\n")
        .replace(/^['"]|['"]$/g, "");

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
