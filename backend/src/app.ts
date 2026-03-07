import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import { connectDB } from "./config/db.js";
import routes from "./routers/index.js";
import morgan from "morgan";

dotenv.config();
const app = express();
connectDB();

app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.set('PORT', process.env.PORT || 3000);


export default app;