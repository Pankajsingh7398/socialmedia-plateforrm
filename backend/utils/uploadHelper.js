const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { cloudinary } = require('../config/cloudinary');

const compressImage = async (buffer) => {
  return sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
};

const uploadToLocal = async (buffer, filename) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueName = `${Date.now()}-${filename}`;
  const filePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    publicId: uniqueName,
  };
};

const uploadToCloudinary = (buffer, folder = 'social-media') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

const uploadImage = async (buffer, originalName) => {
  const compressed = await compressImage(buffer);

  if (process.env.STORAGE_TYPE === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(compressed);
  }

  return uploadToLocal(compressed, originalName);
};

const deleteImage = async (publicId) => {
  if (process.env.STORAGE_TYPE === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // ignore deletion errors
    }
    return;
  }

  const filePath = path.join(__dirname, '../uploads', publicId);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

const uploadVideo = async (buffer, originalName) => {
  if (process.env.STORAGE_TYPE === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'pulse-videos', resource_type: 'video' },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id, thumbnail: result.thumbnail_url });
        }
      );
      stream.end(buffer);
    });
  }
  return uploadToLocal(buffer, originalName);
};

module.exports = { uploadImage, uploadVideo, deleteImage, compressImage };
