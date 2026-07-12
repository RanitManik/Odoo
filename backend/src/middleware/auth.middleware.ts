import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    status: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = verifyToken(token) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid user" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Forbidden: Account is inactive" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
