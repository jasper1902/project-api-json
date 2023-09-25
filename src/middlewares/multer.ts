import multer, { diskStorage } from "multer";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import fs from "fs";
import path from "path";

const storage = diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    const imagePath =
      process.env.NODE_ENV === "production"
        ? path.join(__dirname, "..", "public", "images")
        : path.join(__dirname, "public", "images");

    fs.mkdirSync(imagePath, { recursive: true });

    cb(null, imagePath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    const uniqueSuffix = uuidv4();
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    const uniqueFilename = `${sanitizedOriginalName}-${uniqueSuffix}.jpg`;
    cb(null, uniqueFilename);
  },
});

const Pdfstorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    const pdfPath =
      process.env.NODE_ENV === "production"
        ? path.join(__dirname, "..", "public", "pdf")
        : path.join(__dirname, "public", "pdf");

    fs.mkdirSync(pdfPath, { recursive: true });

    cb(null, pdfPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, file.originalname);
  },
});

export const image = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB
}).single("image");

export const pdf = multer({
  storage: Pdfstorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB
}).single("file");
