const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { notifyFileUploaded, notifyFileDeleted } = require('../websocket');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const safeName = `${baseName}_${timestamp}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileInfo(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    const stats = fs.statSync(filePath);
    return {
      name: fileName,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      modifiedAt: stats.mtime.toISOString(),
      createdAt: stats.birthtime.toISOString()
    };
  } catch (err) {
    return null;
  }
}

router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const fileList = files
      .map(fileName => getFileInfo(fileName))
      .filter(file => file !== null)
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

    res.json({
      success: true,
      files: fileList,
      total: fileList.length
    });
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileInfo = getFileInfo(req.file.filename);
    
    notifyFileUploaded(fileInfo);

    res.json({
      success: true,
      file: fileInfo
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

router.get('/download/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    const originalName = fileName.replace(/_\d+\./, '.');

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Content-Length', stats.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

router.delete('/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    fs.unlinkSync(filePath);
    notifyFileDeleted(fileName);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    let totalSize = 0;
    files.forEach(fileName => {
      const filePath = path.join(UPLOAD_DIR, fileName);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch (e) {}
    });

    res.json({
      success: true,
      stats: {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize)
      }
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
