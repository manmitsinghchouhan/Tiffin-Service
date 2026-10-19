import ApiError from "./ApiError.js";
import { getCloudinary } from "../config/cloudinary.config.js";

export const uploadImageBuffer = (buffer, folder) => {
  const client = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(
            new ApiError(502, "Failed to upload image. Please try again."),
          );
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
};
