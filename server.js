const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

app.get('/test', (req, res) => {
  res.send('Server is running');
});

// New route to handle image upload
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default; // Dynamic import of node-fetch
    const formData = new FormData();
    formData.append('hash', req.body.hash);
    formData.append('image', fs.createReadStream(req.file.path));

    const response = await fetch('https://mypress-output.paragoniu.app/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
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