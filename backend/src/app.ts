import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import homeRouter from "./routers/home.routes.js";
import aboutRouter from "./routers/about.routes.js";
import authRouter from "./routers/auth.routes.js";
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/api", homeRouter);
app.use("/api", aboutRouter);
app.use("/api", authRouter);

export default app;
export { PORT };