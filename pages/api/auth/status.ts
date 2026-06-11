import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "../../../lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const sessionCookie = req.cookies.__session;

  if (!sessionCookie) {
    return res.status(200).json({
      isAuthenticated: false,
      user: null,
      isAuthorized: false,
    });
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    const email = decodedClaims.email || "";
    const allowedEmail = process.env.ALLOWED_ADMIN_EMAIL || "";
    const isAuthorized = email.toLowerCase() === allowedEmail.toLowerCase() && allowedEmail !== "";

    return res.status(200).json({
      isAuthenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email || null,
        name: decodedClaims.name || null,
        picture: decodedClaims.picture || null,
      },
      isAuthorized,
    });
  } catch (error) {
    console.error("Session verification failed in status endpoint:", error);
    
    // Clear invalid cookie if verification failed
    try {
      const isProd = process.env.NODE_ENV === "production";
      const cookieDomain = process.env.COOKIE_DOMAIN;
      let cookieStr = `__session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`;
      if (cookieDomain) {
        cookieStr += `; Domain=${cookieDomain}`;
      }
      res.setHeader("Set-Cookie", cookieStr);
    } catch (cookieError) {
      console.error("Failed to clear invalid cookie:", cookieError);
    }

    return res.status(200).json({
      isAuthenticated: false,
      user: null,
      isAuthorized: false,
    });
  }
}
