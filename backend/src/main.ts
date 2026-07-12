import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

import { authRouter } from "./routes/auth.route";
import departmentRouter from "./routes/department.route";
import categoryRouter from "./routes/category.route";
import employeeRouter from "./routes/employee.route";
import assetRouter from "./routes/asset.route";
import transferRouter from "./routes/transfer.route";
import bookingRouter from "./routes/booking.route";
import maintenanceRouter from "./routes/maintenance.route";
import auditRouter from "./routes/audit.route";
import reportRouter from "./routes/report.route";
import notificationRouter from "./routes/notification.route";
import { errorHandler } from "./middleware/error.middleware";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = express();
app.set("trust proxy", 1); // Trust first proxy to allow secure cookies in production

const allowedOrigins = [
  "http://localhost:3000",
  "https://odoo-frontend-bice.vercel.app",
  "https://assetflow.5dev.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".5dev.in")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/assets", assetRouter);
app.use("/api/transfers", transferRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/audits", auditRouter);
app.use("/api/reports", reportRouter);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.send({ message: "Welcome to AssetFlow API" });
});

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
