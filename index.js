import 'dotenv/config';
import express from 'express';
import genai from './genai.js';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
app.set('trust proxy', true);

// --- Multer Configuration ---

// Ensure the uploads directory exists
const uploadsDir = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage engine for saving files to disk
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ip = req.ip.replace(/:/g, '-');
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${ip}-${timestamp}${extension}`);
  }
});

// Multer instance for existing endpoints
const uploadToDisk = multer({ storage: diskStorage });

// File filter for the new chat endpoint
const chatFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, audio, and PDF files are allowed.'), false);
  }
};

// Multer instance for the new chat endpoint with size and file type validation
const uploadForChat = multer({
  storage: diskStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: chatFileFilter
});

app.use(cors());
app.use(express.json());

// Serve static files from the 'public/frond-end' directory
app.use(express.static(path.join(path.resolve(), 'public', 'frond-end')));

// Serve index.html for the root URL
app.get('/', (req, res) => {
  const indexPath = path.join(path.resolve(), 'public', 'frond-end', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading page');
    }
    const port = process.env.PORT || 3000;
    const baseUrl = `${process.env.BASE_URL}:${port}`;
    const modifiedData = data.replace('<!-- API_BASE_URL_PLACEHOLDER -->', `<script>window.API_BASE_URL = '${baseUrl}';</script>`);
    res.send(baseUrl);
  });
});

// --- API Endpoints ---

app.post('/api/v1/generate-text', async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt) {
      return res.status(400).json({ code: 400, status: 'Bad Request', message: 'Prompt is required' });
    }
    const response = await genai(prompt);
    res.json({ code: 200, status: 'OK', result: response });
  } catch (error) {
    res.status(500).json({ code: 500, status: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/v1/generate-with-attachment', uploadToDisk.single('attachment'), async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const attachment = req.file;
    if (!prompt) {
      return res.status(400).json({ code: 400, status: 'Bad Request', message: 'Prompt is required' });
    }
    if (!attachment) {
      return res.status(400).json({ code: 400, status: 'Bad Request', message: 'Attachment file is required' });
    }
    const fileBuffer = fs.readFileSync(attachment.path);
    const attachmentBase64 = fileBuffer.toString('base64');
    const response = await genai(prompt, attachmentBase64, attachment.mimetype);
    res.json({ code: 200, status: 'OK', result: response });
  } catch (error) {
    res.status(500).json({ code: 500, status: 'Internal Server Error', message: error.message });
  }
});

// New unified chat endpoint
app.post('/api/v1/chat', (req, res) => {
  const upload = uploadForChat.single('attachment');

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ code: 400, status: 'Bad Request', message: 'File size exceeds the 1MB limit.' });
      }
      return res.status(400).json({ code: 400, status: 'Bad Request', message: err.message });
    } else if (err) {
      return res.status(400).json({ code: 400, status: 'Bad Request', message: err.message });
    }

    try {
      const prompt = req.body?.prompt;
      const attachment = req.file;

      if (!prompt && !attachment) {
        return res.status(400).json({ code: 400, status: 'Bad Request', message: 'Either prompt or attachment is required.' });
      }

      let attachmentBase64 = null;
      let mimetype = null;

      if (attachment) {
        const fileBuffer = fs.readFileSync(attachment.path);
        attachmentBase64 = fileBuffer.toString('base64');
        mimetype = attachment.mimetype;
      }

      const response = await genai(prompt || '', attachmentBase64, mimetype);

      res.json({ code: 200, status: 'OK', result: response });

    } catch (error) {
      res.status(500).json({ code: 500, status: 'Internal Server Error', message: error.message });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    console.error(`Error starting server: ${error.message}`);
  } else {
    console.log(`Server is running on port ${PORT}`);
  }
});