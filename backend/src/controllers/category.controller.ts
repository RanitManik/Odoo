import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const updateCategorySchema = createCategorySchema.partial();

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await prisma.assetCategory.findMany({
    orderBy: { createdAt: "desc" },
  });
  return res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const data = createCategorySchema.parse(req.body);

  const existing = await prisma.assetCategory.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    return res.status(400).json({ error: "Category name already exists" });
  }

  const category = await prisma.assetCategory.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status || "ACTIVE",
    },
  });

  return res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateCategorySchema.parse(req.body);

  if (data.name) {
    const existing = await prisma.assetCategory.findUnique({
      where: { name: data.name },
    });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: "Category name already exists" });
    }
  }

  const category = await prisma.assetCategory.update({
    where: { id },
    data,
  });

  return res.json(category);
};
