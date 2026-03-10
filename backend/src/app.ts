import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import { connectDB } from "./config/db.js";
import routes from "./routers/index.js";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();
const app = express();
connectDB();

app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use(errorHandler);

app.set('PORT', process.env.PORT || 3000);


export default app;