import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth } from "../../../lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: "Missing ID token" });
      }

      // Set session expiration to 5 days
      const expiresIn = 5 * 24 * 60 * 60 * 1000;

      // Create the session cookie
      const adminAuth = getAdminAuth();
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
      });

      const isProd = process.env.NODE_ENV === "production";
      const cookieDomain = process.env.COOKIE_DOMAIN;
      let cookieStr = `__session=${sessionCookie}; HttpOnly; Path=/; Max-Age=${5 * 24 * 60 * 60}; SameSite=Lax${isProd ? "; Secure" : ""}`;
      if (cookieDomain) {
        cookieStr += `; Domain=${cookieDomain}`;
      }

      res.setHeader("Set-Cookie", cookieStr);
      return res.status(200).json({ status: "success" });
    } catch (error: any) {
      console.error("Session creation error in url-shortener:", error);
      return res.status(401).json({ error: "Unauthorized session creation" });
    }
  } else if (req.method === "DELETE") {
    try {
      const isProd = process.env.NODE_ENV === "production";
      const cookieDomain = process.env.COOKIE_DOMAIN;
      let cookieStr = `__session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`;
      if (cookieDomain) {
        cookieStr += `; Domain=${cookieDomain}`;
      }

      res.setHeader("Set-Cookie", cookieStr);
      return res.status(200).json({ status: "success" });
    } catch (error: any) {
      console.error("Session deletion error in url-shortener:", error);
      return res.status(500).json({ error: "Failed to delete session" });
    }
  } else {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
