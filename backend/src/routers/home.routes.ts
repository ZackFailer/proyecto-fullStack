import { Router } from "express";
import homeController from "../controllers/home.controller.js";

const router = Router();

router.get('/home', homeController.getHome);
router.post('/home', homeController.createHome);
router.put('/home', homeController.updateHome);
router.patch('/home', homeController.updateHome);
router.delete('/home', homeController.deleteHome);

export default router;
