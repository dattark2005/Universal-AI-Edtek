import express from 'express';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import User from '../models/User';

const router = express.Router();

const upload = multer();

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Delete previous avatar if exists and is a Cloudinary image
    const userId = req.user?.id;
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.avatar && user.avatar.includes('res.cloudinary.com')) {
        // Extract public_id from the URL
        const matches = user.avatar.match(/\/avatars\/([^\.\/]+)\./);
        if (matches && matches[1]) {
          const publicId = `avatars/${matches[1]}`;
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
          } catch (e) {
            console.warn('Failed to delete previous Cloudinary avatar:', e);
          }
        }
      }
    }

    // Upload to Cloudinary using stream
    const streamUpload = (fileBuffer: Buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars', resource_type: 'image' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result: any = await streamUpload(req.file.buffer);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: { url: result.secure_url }
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading file'
    });
  }
});

export default router;