import type { RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

export const authenticateFirebase: RequestHandler = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Failed to verify Firebase ID token", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
