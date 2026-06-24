const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  if (
    process.env.STORAGE_TYPE === 'cloudinary' &&
    process.env.CLOUDINARY_CLOUD_NAME
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
  }
  return null;
};

module.exports = { configureCloudinary, cloudinary };
