import dotenv from "dotenv";
dotenv.config();

let cloudinaryInstance = null;

export const getCloudinary = () => {
  if (!cloudinaryInstance) {
    cloudinaryInstance = {
      uploader: {
        upload_stream: (options, callback) => {
          return {
            end: (buffer) => {
              callback(
                new Error(
                  "Cloudinary package not configured yet. Set credentials in .env to enable uploads.",
                ),
                null,
              );
            },
          };
        },
      },
    };
  }
  return cloudinaryInstance;
};
