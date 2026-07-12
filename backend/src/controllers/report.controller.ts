import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * GET /api/reports/export-csv
 */
export const exportCSV = async (req: Request, res: Response) => {
  const { status, categoryId, departmentId, startDate, endDate } = req.query;

  // Build prisma query filters
  const whereClause: any = {};

  if (status) {
    whereClause.status = String(status);
  }

  if (categoryId) {
    whereClause.categoryId = String(categoryId);
  }

  if (departmentId) {
    whereClause.departmentId = String(departmentId);
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(String(startDate));
    }
    if (endDate) {
      whereClause.createdAt.lte = new Date(String(endDate));
    }
  }

  const assets = await prisma.asset.findMany({
    where: whereClause,
    include: {
      category: true,
      department: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Construct CSV string
  const headers = [
    "Asset Name",
    "Asset Tag",
    "Serial Number",
    "Category",
    "Department",
    "Status",
    "Bookable",
    "Current Holder",
    "Acquisition Cost",
    "Acquisition Date",
    "Expected Return Date",
    "Added Date",
  ];

  const rows = assets.map((a) => [
    `"${a.name.replace(/"/g, '""')}"`,
    `"${a.assetTag.replace(/"/g, '""')}"`,
    a.serialNumber ? `"${a.serialNumber.replace(/"/g, '""')}"` : '""',
    `"${a.category.name.replace(/"/g, '""')}"`,
    a.department ? `"${a.department.name.replace(/"/g, '""')}"` : '""',
    `"${a.status}"`,
    a.isBookable ? "Yes" : "No",
    a.user ? `"${a.user.name.replace(/"/g, '""')}"` : '""',
    a.acquisitionCost ? a.acquisitionCost.toString() : "0",
    a.acquisitionDate ? a.acquisitionDate.toISOString().split("T")[0] : "",
    a.expectedReturnDate
      ? a.expectedReturnDate.toISOString().split("T")[0]
      : "",
    a.createdAt.toISOString().split("T")[0],
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=assets-report.csv",
  );
  return res.send(csvContent);
};
