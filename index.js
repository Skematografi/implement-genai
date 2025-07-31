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
  '/api/v1/generate-from-image', 
  upload.single('image'),
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
        
        const image = req.file;
        if (!image) {
            return res.status(400).json({
              code: 400,
              status: 'Bad Request',
              message: 'Image file is required'
            });
        }

        const imgBase64 = image.buffer.toString('base64');

        const response = await genai(prompt, imgBase64, image.mimetype);

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

app.listen(PORT, () => 
  console.log(`Server is running on port ${PORT}`)
);