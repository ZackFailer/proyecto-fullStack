import { Request, Response, NextFunction } from 'express';

const aboutController = {
    getAbout: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({
            success: true,
            message: 'About info',
            data: { username: 'Paul Joseph' }
        });
    },
    createAbout: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "POST about" });
    },
    updateAbout: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "PUT/PATCH about" });
    },
    deleteAbout: (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true, message: "DELETE about" });
    }
}

export default aboutController;