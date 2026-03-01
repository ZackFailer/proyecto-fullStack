import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import homeRouter from "./routers/home.routes.js";
import aboutRouter from "./routers/about.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", homeRouter);
app.use("/api", aboutRouter);

export default app;
export { PORT };