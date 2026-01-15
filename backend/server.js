require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// --- 1. INITIALIZE GROQ ---
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

// --- 2. MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/content_lab')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const Chat = mongoose.model('Chat', new mongoose.Schema({
  title: { type: String, default: 'New Analysis' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now }
}));

// --- 3. LOAD ALL CONTENT DATA ---
const loadAllContentData = () => {
  const ids = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006'];
  const allContentData = {};

  const mPath = path.join(__dirname, 'data', 'content_metadata.json');
  // Load the full metadata array
  const metadataArray = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : [];
  
  // Convert array to a lookup object by ID
  const metadataMap = {};
  metadataArray.forEach(m => { metadataMap[m.content_id] = m; });

  ids.forEach(id => {
    const pPath = path.join(__dirname, 'data', `${id}.json`);
    if (fs.existsSync(pPath)) {
      allContentData[id] = {
        // Spread all metadata fields (archetype, goal, tone, etc.)
        ...(metadataMap[id] || { title: "Unknown" }),
        dailyData: JSON.parse(fs.readFileSync(pPath, 'utf8'))
      };
    }
  });
  
  return allContentData;
};

const getMetadataString = () => {
  return Object.entries(ALL_CONTENT_DATA).map(([id, data]) => {
    return `[${id}] ${data.title} | Type: ${data.archetype} | Goal: ${data.primary_goal} | Tone: ${data.tone}\nDesc: ${data.description}`;
  }).join('\n\n');
};


const ALL_CONTENT_DATA = loadAllContentData();

// --- 4. COMPRESS DATA FOR AI (Token-Efficient) ---
// --- 4. CONVERT DATA TO TOON (ULTRA TOKEN-EFFICIENT) ---
// --- 4. CONVERT DATA TO TOON v2 (LOSSLESS, -40% TOKENS) ---
const convertDataToTOON = () => {
  const P = { instagram: 'i', facebook: 'f', x: 'x', pinterest: 'p' };
  let out = [];

  // Metadata & Schema
  out.push('$m y m d v r s w l sh c sv nf vf vnf'); // Added y (year) and m (month)
  out.push('$scale s,w,l,sh,c,sv x10');
  out.push('$platform i=instagram f=facebook x=x p=pinterest\n');

  Object.entries(ALL_CONTENT_DATA).forEach(([id, content]) => {
    out.push(`@${id}|${content.title}`);

    const byPlatform = {};
    content.dailyData.forEach(d => {
      if (!byPlatform[d.platform]) byPlatform[d.platform] = [];
      byPlatform[d.platform].push(d);
    });

    Object.entries(byPlatform).forEach(([platform, rows]) => {
      out.push(`#${P[platform]}`);

      rows.forEach((d) => {
        // Parse date parts: 2025-12-15 -> [2025, 12, 15]
        const [year, month, day] = d.date.split('-');
        
        // Shorten year to 2 digits (e.g., 25, 26) to save tokens
        const shortYear = year.slice(-2);

        out.push([
          shortYear,
          month,
          day,
          d.view_count,
          d.reach,
          Math.round(d.skip_rate * 10),
          Math.round(d.average_watch_time * 10),
          Math.round(d.like_rate * 10),
          Math.round(d.share_rate * 10),
          Math.round(d.comment_rate * 10),
          Math.round(d.save_rate * 10),
          d.new_followers,
          d.views_from_followers,
          d.views_from_non_followers
        ].join(' '));
      });
    });
    out.push(''); // Content separator
  });

  return out.join('\n');
};



// --- 5. THE GROQ CHAT ROUTE - COMPRESSED BUT COMPLETE ---
app.post('/api/chat', async (req, res) => {
  try {
    const { chatId, query } = req.body;
    let chat = (chatId && mongoose.Types.ObjectId.isValid(chatId)) 
               ? await Chat.findById(chatId) 
               : new Chat({ messages: [] });

    // Get compressed data
    const toonData = convertDataToTOON();
    const contentMetadata = getMetadataString();

    // Build system prompt
    const systemPrompt = `
You are Oracle, the Content Lab Strategic AI.

--- CONTENT STRATEGY METADATA ---
${contentMetadata}

You are given COMPLETE performance data in TOON format.

TOON FORMAT RULES:
- @CXXX|Title → content header
- #platform → platform section
- Each row = one day
- Values are positional, schema below

SCHEMA (fixed order):
y m d v r s w l sh c sv nf vf vnf

Where:
y=year(YY)
m=month(MM)
d=day(DD)
v=views
r=reach
s=skip_rate(%)
w=avg_watch_time(sec)
l=like_rate(%)
sh=share_rate(%)
c=comment_rate(%)
sv=save_rate(%)
nf=new_followers
vf=views_from_followers
vnf=views_from_non_followers

DATA:
${toonData}

YOUR TASKS:
- Cross-content trend analysis (C001–C006)
- Viral spike detection & decay
- Platform comparison
- Engagement & follower growth analysis
- Strategic recommendations

Respond with data-backed insights.
`;

    console.log("Request size (KB):", Buffer.byteLength(JSON.stringify(systemPrompt)) / 1024);
    // Call Groq
    const completion = await groq.chat.completions.create({
      /*model: "llama-3.3-70b-versatile",*/
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        ...chat.messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: query }
      ],
      temperature: 0.5,
      max_tokens: 1024
    });

    const aiResponse = completion.choices[0].message.content;

    // Update DB
    chat.messages.push(
      { role: 'user', content: query }, 
      { role: 'assistant', content: aiResponse }
    );
    chat.lastUpdated = new Date();
    if (chat.messages.length <= 2) {
      chat.title = query.substring(0, 50);
    }

    await chat.save();
    res.json(chat);

  } catch (error) {
    console.error("❌ GROQ ERROR:", error);
    res.status(500).json({ error: "Analysis Failed", details: error.message });
  }
});

// --- 6. ADDITIONAL ROUTES ---
app.get('/api/chats', async (req, res) => {
  const chats = await Chat.find().sort({ lastUpdated: -1 });
  res.json(chats);
});

app.delete('/api/chats/:id', async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Get all content data (full version)
app.get('/api/content', (req, res) => {
  res.json(ALL_CONTENT_DATA);
});

// Get specific content data (full version)
app.get('/api/content/:id', (req, res) => {
  const data = ALL_CONTENT_DATA[req.params.id];
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'Content not found' });
  }
});

// --- 7. WHAT-IF SIMULATOR ROUTE ---
app.post('/api/simulate', async (req, res) => {
  try {
    const { conceptTitle, description, targetPlatform, plannedDuration } = req.body;

    if (!conceptTitle || !targetPlatform || !plannedDuration) {
      return res.status(400).json({ error: 'Missing required fields: conceptTitle, targetPlatform, plannedDuration' });
    }

    // Get compressed TOON data
    const toonData = convertDataToTOON();
    const contentMetadata = getMetadataString();

    // Build system prompt for prediction
    const systemPrompt = `
You are Oracle, the Content Lab Strategic AI - Predictive Analytics Engine.

--- HISTORICAL PERFORMANCE DATA ---
${contentMetadata}

--- COMPLETE PERFORMANCE DATA (TOON FORMAT) ---
${toonData}

TOON FORMAT RULES:
- @CXXX|Title → content header
- #platform → platform section (i=instagram, f=facebook, x=x, p=pinterest)
- Each row = one day
- Schema: y m d v r s w l sh c sv nf vf vnf
  Where: y=year(YY), m=month(MM), d=day(DD), v=views, r=reach, s=skip_rate(%), w=avg_watch_time(sec), l=like_rate(%), sh=share_rate(%), c=comment_rate(%), sv=save_rate(%), nf=new_followers, vf=views_from_followers, vnf=views_from_non_followers

--- YOUR TASK ---
Based on the historical performance patterns in the provided data, act as a predictive model.

Analyze the performance patterns for similar content types, archetypes, and goals.
${targetPlatform === 'All Platforms' 
  ? 'Since "All Platforms" is selected, analyze cross-platform performance and provide aggregate predictions across Instagram, Facebook, X, and Pinterest.'
  : `Focus on performance patterns specifically for ${targetPlatform}.`}
Consider:
- Average reach and view counts ${targetPlatform === 'All Platforms' ? 'across all platforms' : `for ${targetPlatform}`}
- Engagement rate patterns
- Content archetype performance
- Seasonal/trend patterns visible in the data
${description ? `- Content description and strategy: "${description}"` : ''}

Provide your prediction in the following JSON format:
{
  "reach": <estimated_reach_number>,
  "viewCount": <estimated_view_count_number>,
  "engagementRate": <estimated_engagement_rate_percentage>,
  "reasoning": "<detailed_explanation_of_your_prediction_based_on_historical_patterns>",
  "confidenceScore": <confidence_score_0_to_100>
}

Be specific and data-driven in your reasoning. Reference actual patterns you see in the historical data.
${targetPlatform === 'All Platforms' ? 'Provide aggregate predictions that account for performance across all platforms.' : ''}
`;

    const userPrompt = `
Predict performance for:
- Concept Title: "${conceptTitle}"
${description ? `- Description: "${description}"` : ''}
- Target Platform: "${targetPlatform}"
- Planned Duration: ${plannedDuration} days

Provide your prediction in the JSON format specified.
`;

    // Call Groq
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent predictions
      max_tokens: 1024
      // Note: response_format may not be supported by all models, so we handle parsing manually
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse JSON response with multiple fallback strategies
    let prediction;
    try {
      // Try direct JSON parse first
      prediction = JSON.parse(aiResponse);
    } catch (parseError) {
      try {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                         aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          prediction = JSON.parse(jsonStr);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (secondError) {
        // Last resort: try to extract key-value pairs manually
        console.warn('JSON parsing failed, attempting manual extraction');
        const reachMatch = aiResponse.match(/"reach":\s*(\d+)/i) || aiResponse.match(/reach[:\s]+(\d+)/i);
        const viewMatch = aiResponse.match(/"viewCount":\s*(\d+)/i) || aiResponse.match(/viewCount[:\s]+(\d+)/i) || aiResponse.match(/views?[:\s]+(\d+)/i);
        const engMatch = aiResponse.match(/"engagementRate":\s*([\d.]+)/i) || aiResponse.match(/engagementRate[:\s]+([\d.]+)/i) || aiResponse.match(/engagement[:\s]+([\d.]+)/i);
        const confMatch = aiResponse.match(/"confidenceScore":\s*(\d+)/i) || aiResponse.match(/confidenceScore[:\s]+(\d+)/i) || aiResponse.match(/confidence[:\s]+(\d+)/i);
        
        prediction = {
          reach: reachMatch ? parseInt(reachMatch[1]) : 0,
          viewCount: viewMatch ? parseInt(viewMatch[1]) : 0,
          engagementRate: engMatch ? parseFloat(engMatch[1]) : 0,
          reasoning: aiResponse.substring(0, 500) || "Prediction based on historical patterns.",
          confidenceScore: confMatch ? parseInt(confMatch[1]) : 75
        };
      }
    }

    // Validate and structure response
    const result = {
      conceptTitle,
      description: description || '',
      targetPlatform,
      plannedDuration,
      prediction: {
        reach: prediction.reach || 0,
        viewCount: prediction.viewCount || prediction.view_count || 0,
        engagementRate: prediction.engagementRate || prediction.engagement_rate || 0,
        reasoning: prediction.reasoning || "Prediction based on historical patterns.",
        confidenceScore: prediction.confidenceScore || prediction.confidence_score || 75
      }
    };

    res.json(result);

  } catch (error) {
    console.error("❌ SIMULATION ERROR:", error);
    res.status(500).json({ error: "Simulation Failed", details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 GROQ SERVER LIVE ON PORT ${PORT}`);
  console.log(`📊 Loaded complete data for: ${Object.keys(ALL_CONTENT_DATA).join(', ')}`);
});