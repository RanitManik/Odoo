import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key-12345";

export const signToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
