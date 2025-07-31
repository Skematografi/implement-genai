import 'dotenv/config';
import express from 'express';
import genai from './genai.js';

const app = express();

app.use(express.json());

app.post('/api/v1/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;

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


// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => 
  console.log(`Server is running on port ${PORT}`)
);