const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
exports.uploads = async (file, folder) => {
  const result = await cloudinary.uploader.upload(file, { resource_type: 'image', folder, secure: true });
  return { url: result.secure_url, id: result.public_id };
};
