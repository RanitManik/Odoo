import { defineConfig } from "@prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrations: {
    seed: 'npx ts-node -P ./tsconfig.app.json ./prisma/seed.ts',
  },
});
