const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 3001;

app.use(cors());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/test', (req, res) => {
  res.send('Server is running');
});

// New route to handle image upload
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await fetch('https://mypress-output.paragoniu.app/upload-image', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});