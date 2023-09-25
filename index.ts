import express, { Response, Request, NextFunction } from "express";
import * as dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./src/configs/db";
import { catchInvalidJsonError } from "./src/middlewares/catchInvalidJsonError";
import createHttpError, { isHttpError } from "http-errors";
import projectsRoute from "./src/routes/project";
import userRoute from "./src/routes/user";
import contactRote from "./src/routes/contact";
dotenv.config();
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI as string);

const app = express();
app.use(catchInvalidJsonError);
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());


app.use("/api/project", projectsRoute);
app.use("/api/account", userRoute);
app.use("/api/contact", contactRote);

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ message: errorMessage });
});

app.listen(PORT, () => console.log("listening on port", PORT));
