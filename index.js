import 'dotenv/config';
import express from 'express';
import genai from './genai.js';
import multer from 'multer';

const app = express();
const upload = multer();

app.use(express.json());

app.post('/api/v1/generate-text', async (req, res) => {
  try {
    const prompt = req.body?.prompt;

    if (!prompt) {
      return res.status(400).json({
        code: 400,
        status: 'Bad Request',
        message: 'Prompt is required'
      });
    }

    const response = await genai(prompt);

    res.json({
      code: 200,
      status: 'OK',
      result: response
    });

  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post(
  '/api/v1/generate-with-attachment',
  upload.single('attachment'),
  async (req, res) => {
    try {
      const prompt = req.body?.prompt;
      if (!prompt) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'Prompt is required'
        });
      }

      const attachment = req.file;
      if (!attachment) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          message: 'Attachment file is required'
        });
      }

      const attachmentBase64 = attachment.buffer.toString('base64');

      const response = await genai(prompt, attachmentBase64, attachment.mimetype);

      res.json({
        code: 200,
        status: 'OK',
        result: response
      });

    } catch (error) {
      res.status(500).json({
        code: 500,
        status: 'Internal Server Error',
        message: error.message
      });
    }
  }
);


// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Error starting server: ${error.message}`);
  } else {
    console.log(`Server is running on port ${PORT}`);
  }
});