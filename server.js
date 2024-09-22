const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/test', (req, res) => {
  res.send('Server is running');
});


app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const formData = new FormData();
    formData.append('hash', req.body.hash);
    formData.append('image', req.file.buffer, req.file.originalname);

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
    res.status(500).json({ success: false, message: err.message });
  }
});
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});