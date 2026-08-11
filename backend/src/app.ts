import express from 'express';
import cors from 'cors';
import helmet from 'helmet'
import morgan from "morgan";
import errorMiddleware from './middleware/error.middleware';
import notFoundMiddleware from './middleware/not-found.middleware';
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
