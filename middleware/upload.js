const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create specific directories based on file type
    let destPath = uploadDir;
    
    if (file.fieldname === 'gstCertificate' || file.fieldname === 'udyamCertificate') {
      destPath = path.join(uploadDir, 'documents');
    } else if (file.fieldname.includes('package')) {
      destPath = path.join(uploadDir, 'packages');
    } else if (file.fieldname.includes('lms')) {
      destPath = path.join(uploadDir, 'lms');
    } else if (file.fieldname.includes('sightseeing')) {
      destPath = path.join(uploadDir, 'guestsightseeing');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and documents
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed!'));
  }
};

// Export the configured multer middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.uploadLmsContent = upload;
module.exports.documentUpload = upload;
