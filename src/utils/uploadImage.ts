import axios from "axios";

export const uploadImage = async (
  file: Express.Multer.File | undefined,
  tagList?: string[]
) => {
  try {
    if (!file) {
      throw new Error("No image file received");
    }

    if (!file || !file.mimetype.startsWith("image/")) {
      throw new Error("Please upload an image file");
    }

    if (!file.buffer || !file.originalname) {
      throw new Error("Invalid image file format");
    }

    if (
      !process.env.IMAGE_SERVICE_URL ||
      !process.env.IMAGE_SERVICE_TOKEN ||
      typeof process.env.IMAGE_SERVICE_URL !== "string" ||
      typeof process.env.IMAGE_SERVICE_TOKEN !== "string"
    ) {
      throw new Error("Required environment variables are missing or invalid");
    }

    const imageData = { file, tagList };
    const response = await axios.post(
      `${process.env.IMAGE_SERVICE_URL}/api/images/upload`,
      imageData,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          filename: file.originalname,
          authorization: `Bearer ${process.env.IMAGE_SERVICE_TOKEN}`,
          tagList: tagList,
        },
      }
    );

    if (response.status === 200) {
      const data = {
        photo: response.data.photo,
        status: true,
      };
      return data;
    } else {
      const errorMessage =
        response.data && response.data.error
          ? response.data.error
          : response.statusText;
      throw new Error(`Error uploading image : ${errorMessage}`);
    }
  } catch (error) {
    console.error(error);
    throw null;
  }
};
