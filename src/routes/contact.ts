import express, { Router } from "express";
import { contact } from "../controllers/contact";

const router: Router = express.Router();
router.post("/", contact);

export default router;
