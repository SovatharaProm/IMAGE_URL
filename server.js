const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;
const uploadDir = path.join(__dirname, 'uploads');

app.use(cors());

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// Test endpoint
app.get('/test', (req, res) => {
  res.send('Server is running');
});

// New route to handle image upload
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    // Full path to the locally stored file
    const filePath = path.join(uploadDir, req.file.filename);

    // Generate pre-signed URL from the external server
    const fetch = (await import('node-fetch')).default;

    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath), req.file.originalname);

    const response = await fetch('https://mypress-output.paragoniu.app/upload-image', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error uploading file to external server:", errorText);
      throw new Error("Failed to upload file to external server");
    }

    const result = await response.json();

    // Respond with both local and external URLs
    res.json({
      success: true,
      message: 'File uploaded successfully',
      localFileUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
      externalFileUrl: result.fileUrl,
    });
  } catch (err) {
    console.error('Error during upload:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
