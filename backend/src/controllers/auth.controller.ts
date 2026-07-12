import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth.middleware";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, department } = signupSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Problem statement dictates new signups are strictly EMPLOYEE
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      department,
      role: "EMPLOYEE",
    },
  });

  const token = signToken({ userId: user.id });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    message: "User created successfully",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.status !== "ACTIVE") {
    return res.status(403).json({ error: "Account is inactive" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    message: "Logged in successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
};

export const me = (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
};
