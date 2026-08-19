import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from "morgan";
import cookieParser from "cookie-parser";
import errorMiddleware from './middleware/error.middleware';
import notFoundMiddleware from './middleware/not-found.middleware';
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;