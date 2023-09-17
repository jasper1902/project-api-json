import express, { Response, Request } from "express";
import * as fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import verifyAdmin from "./verify";
import { image, pdf } from "./multer";
import { MulterError } from "multer";
import { Query, ParamsDictionary } from "express-serve-static-core";
import cors from "cors";

const PORT = process.env.PORT || 5000;

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const filePath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "..", "data.json")
    : path.join(__dirname, "data.json");

interface Project {
  id: string;
  projectName: string;
  category: string;
  stack: string[];
  image?: string;
  projectUrl: string;
}

interface User {
  username: string;
  password: string;
  role?: "admin" | "user";
}

interface Data {
  project: Project[];
  user: User[];
}

async function readDataFile(): Promise<{
  user: User[];
  project: Project[];
}> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (error: unknown) {
    const jsonData: Data = { project: [], user: [] };
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
    } else {
      console.error(error);
    }
    return jsonData;
  }
}
readDataFile();

app.get("/api/project/", async (request: Request, response: Response) => {
  const jsonData = await readDataFile();
  response.status(200).json({ project: jsonData.project });
});

interface CreateProjectRequest {
  projectName: string;
  category: string;
  stack: string[];
  image: string;
  projectUrl: string;
}

app.post(
  "/api/project/",
  [verifyAdmin],
  async (
    request: Request<
      ParamsDictionary,
      unknown,
      CreateProjectRequest,
      Query,
      Record<string, unknown>
    >,
    response: Response
  ) => {
    try {
      image(request, response, async function handleAvatarUpload(err) {
        if (err instanceof MulterError) {
          console.error(err);
          return response
            .status(400)
            .json({ message: "File upload error", error: err.message });
        } else if (err) {
          console.error(err);
          return response
            .status(500)
            .json({ message: "Internal Server Error", error: err.message });
        }

        const jsonData = await readDataFile();
        const { projectName, category, projectUrl, stack } = request.body;

        const lastProductId =
          jsonData.project.length > 0
            ? jsonData.project[jsonData.project.length - 1].id
            : "0";
        const id = String(parseInt(lastProductId) + 1);

        const imagePath = request.file?.filename
          ? `/public/images/${request.file.filename}`
          : undefined;

        const newProduct = {
          projectName,
          category,
          id,
          projectUrl,
          stack,
          image: imagePath,
        };
        jsonData.project.push(newProduct);

        await fs.writeFile(
          filePath,
          JSON.stringify(jsonData, null, 2),
          "utf-8"
        );

        response
          .status(201)
          .json({ message: "Product added successfully", product: newProduct });
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/api/project/:id",
  [verifyAdmin],
  async (request: Request, response: Response) => {
    try {
      const jsonData = await readDataFile();
      const productId = request.params.id;
      const productIndex = jsonData.project.findIndex(
        (project) => project.id === productId
      );
      if (productIndex === -1) {
        return response.status(404).json({ error: "Product not found" });
      }

      jsonData.project.splice(productIndex, 1);
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

      response.status(200).json({ message: "Product deleted successfully!" });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/api/user/register",
  [verifyAdmin],
  async (request: Request, response: Response) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return response.status(400).json({ error: "" });
      }

      const jsonData = await readDataFile();

      const isUsernameTaken = jsonData.user.some(
        (user) => user.username === username
      );
      if (isUsernameTaken) {
        return response.status(400).json({ error: "Username already exists" });
      }
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = {
        username: username,
        password: hashPassword,
        role: "admin" as const,
      };

      jsonData.user.push(newUser);

      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

      response
        .status(201)
        .json({ message: "user added successfully", user: newUser });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post("/api/user/login", async (request: Request, response: Response) => {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return response
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const jsonData = await readDataFile();

    const user = jsonData.user.find((user) => user.username === username);

    if (!user) {
      return response.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return response.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      process.env.TOKEN as string,
      { expiresIn: "7d" }
    );

    response.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.post(
  "/api/pdf/",
  [verifyAdmin],
  async (request: Request, response: Response) => {
    try {
      pdf(request, response, async function handleAvatarUpload(err) {
        if (err instanceof MulterError) {
          console.error(err);
          return response
            .status(400)
            .json({ message: "File upload error", error: err.message });
        } else if (err) {
          console.error(err);
          return response
            .status(500)
            .json({ message: "Internal Server Error", error: err.message });
        }

        response.status(200).json({ message: "upload successful" });
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/public/pdf/:pdfname", (req, res) => {
  const pdfPath =
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "..", "public", "pdf", req.params.pdfname)
      : path.join(__dirname, "public", "pdf", req.params.pdfname);

  res.sendFile(pdfPath);
});

app.get("/public/images/:imageName", (req, res) => {
  const imagePath =
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "..", "public", "images", req.params.imageName)
      : path.join(__dirname, "public", "images", req.params.imageName);

  res.sendFile(imagePath, (error) => {
    if (error) {
      console.error("Error sending file:", error);
      res.status(404).send("Image not found");
    }
  });
});

app.listen(PORT, () => console.log("listening on port ", PORT));
