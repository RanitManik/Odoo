import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seeding.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const itDept = await prisma.department.upsert({
    where: { name: "IT" },
    update: {},
    create: { name: "IT" },
  });

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      departmentId: itDept.id,
      status: "ACTIVE",
    },
  });

  console.log("Admin user created successfully!");
  console.log("Email:", admin.email);
  console.log("Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
