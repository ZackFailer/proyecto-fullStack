import { Request, Response } from 'express';

const aboutController = {
    getAbout: (req: Request, res: Response) => {
        res.json({
            message: 'This is the about page of the backend!',
            username: 'Paul Joseph'
        });
    },
    createAbout: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "POST request received for about page" });
    },
    updateAbout: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "PUT/PATCH request received for about page" });
    },
    deleteAbout: (req: Request, res: Response) => {
        // Implement logic here
        res.json({ message: "DELETE request received for about page" });
    }
}

export default aboutController;