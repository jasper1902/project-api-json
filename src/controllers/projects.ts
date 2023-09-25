import { NextFunction, Request, Response } from "express";
import Project from "../models/Project";
import { Query, ParamsDictionary } from "express-serve-static-core";
import { uploadImage } from "../utils/uploadImage";

export const getProjects = async (
  request: Request,
  response: Response,
  nextFuntion: NextFunction
) => {
  try {
    const projects = await Project.find().sort({ createdAt: "desc" });
    response.status(200).json({ project: projects });
  } catch (error) {
    nextFuntion(error);
  }
};

interface CreateProjectRequest {
  projectName: string;
  category: string;
  stack: string[];
  image: string;
  projectUrl: string;
  tagList?: string[];
}

interface Result {
  photo: {
    id: string;
    width: number;
    height: number;
    url: string;
    alt?: string;
    filename?: string;
    createdAt: Date;
    updatedAt: Date;
    uploader: string;
    tagList: string[];
  };
  status: boolean;
}

export const createProject = async (
  request: Request<
    ParamsDictionary,
    unknown,
    CreateProjectRequest,
    Query,
    Record<string, unknown>
  >,
  response: Response,
  nextFunction: NextFunction
) => {
  try {
    const { projectName, category, projectUrl, stack, tagList } = request.body;
    if (!projectName || !category || !projectUrl || !stack) {
      return response.status(400).json({ message: "Incomplete project data" });
    }
    let result: Result | null = null;
    if (request.file) {
      result = await uploadImage(request.file, tagList);
    }
    const newProduct = {
      projectName,
      category,
      projectUrl,
      stack,
      image: result?.photo.url || undefined,
    };
    await Project.create(newProduct);
    response
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    nextFunction(error);
  }
};

export const updateProduct = async (
  request: Request<ParamsDictionary, unknown, CreateProjectRequest>,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { projectName, category, projectUrl, stack, tagList } = request.body;
    if (!projectName || !category || !projectUrl || !stack) {
      return response.status(400).json({ error: "Incomplete project data" });
    }

    let result: Result | null = null;
    if (request.file) {
      result = await uploadImage(request.file, tagList);
    }
    const updatedProject = {
      projectName,
      category,
      projectUrl,
      stack,
      image: result?.photo.url || undefined,
    };

    await Project.findByIdAndUpdate(id, updatedProject);

    response.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProduct = async (
  request: Request,
  response: Response,
  nextFunction: NextFunction
) => {
  try {
    const { id } = request.params;

    const deleteProduct = await Project.findByIdAndDelete(id);

    if (!deleteProduct) {
      return response.status(404).json({ message: "Product not found" });
    }

    return response
      .status(200)
      .json({ message: "Product deleted successfully!" });
  } catch (error) {
    nextFunction(error);
  }
};
