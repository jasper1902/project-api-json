import express, { Router } from "express";
import {
  createProject,
  deleteProduct,
  getProjects,
  updateProduct,
} from "../controllers/projects";
import verifyAdmin from "../middlewares/verify";
import multer from "multer";
const imageUploader = multer({ storage: multer.memoryStorage() });

const router: Router = express.Router();

router.get("/", getProjects);

router.post("/", [verifyAdmin, imageUploader.single("image")], createProject);

router.put("/:id", [verifyAdmin, imageUploader.single("image")], updateProduct);

router.delete("/:id", [verifyAdmin], deleteProduct);

export default router;
