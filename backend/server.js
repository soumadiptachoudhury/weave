require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Import the NEW SDK
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/content_lab')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. CHAT MODEL
const Chat = mongoose.model('Chat', new mongoose.Schema({
  title: { type: String, default: 'New Conversation' },
  messages: [{
    role: { type: String, enum: ['user', 'ai', 'model'] }, // SDK uses 'model' instead of 'ai'
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now }
}));

// 3. LOAD DATA (C001-C006 + Metadata)
const loadFullDataset = () => {
  const performanceData = {};
  const ids = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006'];
  ids.forEach(id => {
    const pPath = path.join(__dirname, 'data', `${id}.json`);
    if (fs.existsSync(pPath)) performanceData[id] = JSON.parse(fs.readFileSync(pPath, 'utf8'));
  });

  let metadata = {};
  const mPath = path.join(__dirname, 'data', 'content_metadata.json');
  if (fs.existsSync(mPath)) metadata = JSON.parse(fs.readFileSync(mPath, 'utf8'));

  return { performanceData, metadata };
};

const DATASET = loadFullDataset();

// 4. INITIALIZE NEW SDK
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- ROUTES ---

app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ lastUpdated: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { chatId, query } = req.body;
    let chat = chatId ? await Chat.findById(chatId) : new Chat({ messages: [] });

    const systemInstruction = `
      You are the "Content Lab Strategic AI".
      METADATA: ${JSON.stringify(DATASET.metadata)}
      PERFORMANCE: ${JSON.stringify(DATASET.performanceData)}
      
      Link metrics to titles using IDs (C001, etc.). Use data-backed reasoning and Markdown.
    `;

    // The NEW SDK uses a 'contents' array structure
    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + "\n\nUser Query: " + query }] }
      ],
      config: {
        thinkingLevel: 'medium' // Enables the 2026 "Thinking" feature for deeper analysis
      }
    });

    const aiResponse = result.text;

    // Save history (Mapping SDK 'model' role to your DB 'ai' role)
    chat.messages.push({ role: 'user', text: query });
    chat.messages.push({ role: 'ai', text: aiResponse });
    chat.lastUpdated = new Date();

    if (chat.messages.length === 2) {
      const titleRes = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Summarize this query into a 3-word title: ${query}` }] }]
      });
      chat.title = titleRes.text.trim().replace(/"/g, '');
    }

    await chat.save();
    res.json(chat);

  } catch (error) {
    console.error("❌ SDK Error:", error);
    res.status(500).json({ error: "AI Failed to respond" });
  }
});

app.delete('/api/chats/:id', async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.listen(5000, () => console.log(`🚀 Strategy Server Live on Port 5000`));