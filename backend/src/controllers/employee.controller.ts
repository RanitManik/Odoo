import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"])
    .optional(),
  departmentId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (!v ? null : v)),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  role: z
    .enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"])
    .optional(),
  departmentId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (!v ? null : v)),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// ─── Sanitize ─────────────────────────────────────────────────────────────────

function sanitizeBody(body: Record<string, unknown>) {
  const cleaned = { ...body };
  if (cleaned.departmentId === "") cleaned.departmentId = null;
  return cleaned;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/employees
 * Returns all employees (all users), with their department info.
 */
export const getAllEmployees = async (req: Request, res: Response) => {
  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(employees);
};

/**
 * GET /api/employees/:id
 * Returns a single employee by ID.
 */
export const getEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  return res.json(employee);
};

/**
 * POST /api/employees
 * Creates a new employee (admin creates on behalf of user).
 */
export const createEmployee = async (req: Request, res: Response) => {
  const data = createEmployeeSchema.parse(sanitizeBody(req.body));

  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return res
      .status(400)
      .json({ error: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const employee = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "EMPLOYEE",
      departmentId: data.departmentId,
      status: data.status || "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      department: { select: { id: true, name: true } },
    },
  });

  return res.status(201).json(employee);
};

/**
 * PATCH /api/employees/:id
 * Updates an employee's profile (name, email, role, department, status, optionally password).
 */
export const updateEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateEmployeeSchema.parse(sanitizeBody(req.body));

  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: "Email is already in use" });
    }
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    role: data.role,
    departmentId: data.departmentId,
    status: data.status,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const employee = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      department: { select: { id: true, name: true } },
    },
  });

  return res.json(employee);
};
