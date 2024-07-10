const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());

app.get('/test', (req, res) => {
  res.send('Server is running');
});

// Configure AWS SDK
const s3Client = new S3Client({
  region: 'sgp1',
  endpoint: 'https://sgp1.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.DO_SPACE_KEY,
    secretAccessKey: process.env.DO_SPACE_SECRET,
  },
});

app.get('/generate-url', async (req, res) => {
  try {
    const fileName = `${Date.now()}_${req.query.filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACE_NAME,
      Key: fileName,
      ACL: 'public-read', // Ensure ACL is set to public-read
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const fileUrl = `https://${process.env.DO_SPACE_NAME}.sgp1.digitaloceanspaces.com/${fileName}`;
    res.json({ success: true, uploadUrl, fileUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
