import mongoose, { Schema, Model } from "mongoose";

export interface IProject {
  projectName: string;
  category: string;
  stack: string[];
  image?: string;
  projectUrl: string;
}

interface IProjectMethods {}

type ProjectModel = Model<IProject>;

const ProjectSchema = new Schema<IProject, ProjectModel, IProjectMethods>(
  {
    projectName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    stack: [String],
    image: {
      type: String,
    },
    projectUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProject, ProjectModel>("Project", ProjectSchema);
