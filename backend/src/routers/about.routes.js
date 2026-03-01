import { Router } from "express";
import aboutController from "../controllers/about.controller.js";

const router = Router();

router.get('/about', aboutController.getAbout);
router.post('/about', aboutController.createAbout);
router.put('/about', aboutController.updateAbout);
router.patch('/about', aboutController.updateAbout);
router.delete('/about', aboutController.deleteAbout);

export default router;