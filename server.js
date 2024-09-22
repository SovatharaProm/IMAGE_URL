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

// Route to handle image upload and send to external API
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const filePath = path.join(uploadDir, req.file.filename);
    
    // Send the uploaded image to the external API
    const fetch = (await import('node-fetch')).default;
    const formData = new FormData();
    formData.append('hash', req.body.hash);
    formData.append('image', fs.createReadStream(filePath)); // Send the file streams

    const response = await fetch('https://mypress-output.paragoniu.app/upload-image', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to external API: ${response.statusText}`);
    }

    const result = await response.json();

    // Respond with the external API result and the local file URL
    res.json({
      success: true,
      message: 'File uploaded successfully',
      localFileUrl: `http://localhost:${port}/uploads/${req.file.filename}`,
      externalApiResponse: result,
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
