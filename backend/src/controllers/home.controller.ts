import { Request, Response, NextFunction } from "express";

const homeController = {
    getHome: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "GET home", data: { username: "Paul Joseph" } });
    },
    createHome: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "POST home" });
    },
    updateHome: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "PUT/PATCH home" });
    },
    deleteHome: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "DELETE home" });
    }
};

export default homeController;
