const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'navi/guestsightseeing',
    allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto', // Allow both images and videos
    transformation: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

// Custom storage engine to handle file buffers
const memoryStorage = multer.memoryStorage();

// Create multer instance with memory storage
const upload = multer({ 
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, isVideo = false) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'navi/guestsightseeing',
      resource_type: isVideo ? 'video' : 'image'
    };
    
    // Only apply transformations to images
    if (!isVideo) {
      uploadOptions.transformation = [
        { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ];
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    const bufferStream = new (require('stream').PassThrough)();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
