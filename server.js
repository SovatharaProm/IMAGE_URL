const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for storing files locally in 'uploads' directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.get('/test', (req, res) => {
  res.send('Server is running');
});

// Route to handle image upload and send to external storage (DigitalSpace)
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const filePath = path.join(uploadDir, req.file.filename);

    // Generate pre-signed URL from the external server
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://mypress.paragoniu.app/image/generate-url?filename=${req.file.filename}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error generating pre-signed URL:", errorText);
      throw new Error("Failed to generate pre-signed URL");
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Error in response data:", data);
      throw new Error("Failed to generate pre-signed URL");
    }

    // Upload file to the generated pre-signed URL
    const fileStream = fs.createReadStream(filePath);
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      body: fileStream,
      headers: {
        'Content-Type': req.file.mimetype,
        'x-amz-acl': 'public-read',
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Error uploading file:", errorText);
      throw new Error("Failed to upload file");
    }

    // Respond with the external file URL and local storage info
    res.json({
      success: true,
      message: 'File uploaded successfully',
      localFileUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
      externalFileUrl: data.fileUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
