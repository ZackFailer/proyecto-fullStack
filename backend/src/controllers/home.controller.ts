import { Request, Response } from "express";

const homeController = {
    getHome: (req: Request, res: Response) => {
        res.json({
            message: "GET request received for home page",
            username: "Paul Joseph"
        });
    },
    createHome: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "POST request received for home page" });
    },
    updateHome: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "PUT/PATCH request received for home page" });
    },
    deleteHome: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "DELETE request received for home page" });
    }
};

export default homeController;
