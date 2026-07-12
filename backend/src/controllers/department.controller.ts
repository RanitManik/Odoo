import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

// A nullable string field — empty string is treated as null.
// We do NOT use .uuid() here because in Zod v4, format validators run
// before transforms, so empty strings would fail before we can coerce them.
// Prisma's FK constraint will reject genuinely invalid UUIDs at the DB level.
const nullableUUID = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (!v ? null : v));

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  headId: nullableUUID,
  parentId: nullableUUID,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  headId: nullableUUID,
  parentId: nullableUUID,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

/**
 * Strip empty strings from UUID fields before Zod validation runs.
 * This is the guaranteed-safe way regardless of Zod version.
 */
function sanitizeBody(body: Record<string, unknown>) {
  const cleaned = { ...body };
  if (cleaned.parentId === "") cleaned.parentId = null;
  if (cleaned.headId === "") cleaned.headId = null;
  return cleaned;
}

export const getAllDepartments = async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    include: {
      head: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, name: true } },
      subDepartments: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(departments);
};

export const createDepartment = async (req: Request, res: Response) => {
  const data = createDepartmentSchema.parse(sanitizeBody(req.body));

  // Check if department name already exists
  const existing = await prisma.department.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    return res.status(400).json({ error: "Department name already exists" });
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      headId: data.headId,
      parentId: data.parentId,
      status: data.status || "ACTIVE",
    },
    include: {
      head: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
    },
  });

  return res.status(201).json(department);
};

export const updateDepartment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateDepartmentSchema.parse(sanitizeBody(req.body));

  if (data.name) {
    const existing = await prisma.department.findUnique({
      where: { name: data.name },
    });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: "Department name already exists" });
    }
  }

  const department = await prisma.department.update({
    where: { id },
    data,
    include: {
      head: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
    },
  });

  return res.json(department);
};
