import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const authConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getClientAuth() {
  const apps = getApps();
  let authApp = apps.find(app => app.name === "auth-app");
  if (!authApp) {
    if (!authConfig.apiKey) {
      throw new Error("Firebase Auth API Key is missing. Check your environment variables.");
    }
    authApp = initializeApp(authConfig, "auth-app");
  }
  return getAuth(authApp);
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  return provider;
}
