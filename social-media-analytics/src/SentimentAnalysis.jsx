import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sentiment from 'sentiment';
import './SentimentAnalysis.css';

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Sentiment analyzer function
const analyzeSentiment = (text) => {
  // Remove emojis and special characters for better analysis
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Analyze sentiment
  const result = sentiment.analyze(cleanText);
  
  // Normalize score to 0-1 range
  // Sentiment library returns scores typically between -5 and 5
  // We'll normalize this to 0-1 where 0.5 is neutral
  const normalizedScore = Math.max(0, Math.min(1, (result.score + 5) / 10));
  
  // Determine sentiment category
  let sentimentCategory;
  if (normalizedScore >= 0.6) {
    sentimentCategory = 'positive';
  } else if (normalizedScore <= 0.4) {
    sentimentCategory = 'negative';
  } else {
    sentimentCategory = 'neutral';
  }
  
  return {
    sentiment: sentimentCategory,
    score: normalizedScore,
    comparative: result.comparative || 0
  };
};

// Mock comments data (without pre-determined sentiment/score)
const mockCommentsData = [
    { id: 1, text: "Love this! So inspiring ✨", platform: "Instagram", author: "@user123", timestamp: "2h ago" },
    { id: 2, text: "This is exactly what I needed today", platform: "Facebook", author: "John Doe", timestamp: "3h ago" },
    { id: 3, text: "Not really my style but looks good", platform: "Instagram", author: "@user456", timestamp: "4h ago" },
    { id: 4, text: "Amazing work! Keep it up!", platform: "Pinterest", author: "Jane Smith", timestamp: "5h ago" },
    { id: 5, text: "Could be better", platform: "Instagram", author: "@user789", timestamp: "6h ago" },
    { id: 6, text: "This is fantastic! 🔥", platform: "Facebook", author: "Mike Johnson", timestamp: "7h ago" },
    { id: 7, text: "I don't understand the hype", platform: "X", author: "@critic123", timestamp: "8h ago" },
    { id: 8, text: "Pretty good content", platform: "Instagram", author: "@user321", timestamp: "9h ago" },
    { id: 9, text: "Absolutely brilliant!", platform: "Pinterest", author: "Sarah Lee", timestamp: "10h ago" },
    { id: 10, text: "Meh, nothing special", platform: "Instagram", author: "@user654", timestamp: "11h ago" },
    { id: 11, text: "Wow, this actually changed how I think about it", platform: "Instagram", author: "@mindshift", timestamp: "12h ago" },
    { id: 12, text: "Nice visuals but the message feels rushed", platform: "Instagram", author: "@visualjunkie", timestamp: "13h ago" },
    { id: 13, text: "This is misleading and poorly explained", platform: "X", author: "@skeptical_sam", timestamp: "14h ago" },
    { id: 14, text: "Saved this for later, super helpful 🙌", platform: "Pinterest", author: "Emily Carter", timestamp: "15h ago" },
    { id: 15, text: "Why is everyone praising this? It's average at best.", platform: "X", author: "@unimpressed", timestamp: "16h ago" },
    { id: 16, text: "Good effort, but I've seen better explanations", platform: "Facebook", author: "Robert Allen", timestamp: "17h ago" },
    { id: 17, text: "Absolutely loved the breakdown, very clear 👌", platform: "Facebook", author: "Priya Mehta", timestamp: "18h ago" },
    { id: 18, text: "This feels like clickbait honestly", platform: "Instagram", author: "@real_talk", timestamp: "19h ago" },
    { id: 19, text: "Informative, but could use more examples", platform: "Pinterest", author: "Daniel Wu", timestamp: "20h ago" },
    { id: 20, text: "Finally someone explained this properly 🔥", platform: "Instagram", author: "@finally_clear", timestamp: "21h ago" },
    { id: 21, text: "Not bad, not great — just okay", platform: "X", author: "@middle_ground", timestamp: "22h ago" },
    { id: 22, text: "I completely disagree with this take", platform: "Facebook", author: "Anita Rao", timestamp: "23h ago" },
    { id: 23, text: "This deserves way more attention than it's getting", platform: "Instagram", author: "@underrated", timestamp: "1d ago" },
    { id: 24, text: "Can you make a follow-up on this topic?", platform: "Facebook", author: "Lucas Brown", timestamp: "1d ago" },
    { id: 25, text: "I'm confused — what's the main point here?", platform: "Instagram", author: "@confused_viewer", timestamp: "1d ago" },
    { id: 26, text: "Decent content, but the title overpromised", platform: "Pinterest", author: "Olivia Chen", timestamp: "1d ago" },
    { id: 27, text: "This actually motivated me to try it myself 💪", platform: "Instagram", author: "@motivated_now", timestamp: "1d ago" },
    { id: 28, text: "Hard pass. Didn't find this useful at all.", platform: "X", author: "@nope_nope", timestamp: "1d ago" },
    { id: 29, text: "Clear, concise, and practical. Thanks!", platform: "Facebook", author: "Suresh Kumar", timestamp: "1d ago" },
    { id: 30, text: "It's fine I guess 🤷‍♂️", platform: "Instagram", author: "@shruglife", timestamp: "1d ago" }
  ];

const SentimentAnalysis = () => {
  const [filterSentiment, setFilterSentiment] = useState('All');
  
  // Analyze all comments and add sentiment/score
  const analyzedComments = useMemo(() => {
    return mockCommentsData.map(comment => {
      const analysis = analyzeSentiment(comment.text);
      return {
        ...comment,
        sentiment: analysis.sentiment,
        score: analysis.score
      };
    });
  }, []);
  
  // Calculate overall stats from analyzed comments
  const overallStats = useMemo(() => {
    const total = analyzedComments.length;
    const positive = analyzedComments.filter(c => c.sentiment === 'positive').length;
    const negative = analyzedComments.filter(c => c.sentiment === 'negative').length;
    const neutral = analyzedComments.filter(c => c.sentiment === 'neutral').length;
    
    return {
      positive: total > 0 ? Math.round((positive / total) * 100) : 0,
      neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
      negative: total > 0 ? Math.round((negative / total) * 100) : 0
    };
  }, [analyzedComments]);
  
  const filteredComments = filterSentiment === 'All' 
    ? analyzedComments 
    : analyzedComments.filter(c => c.sentiment === filterSentiment);

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#747474';
    }
  };


  const platformColors = {
    'Instagram': '#E1306C',
    'Facebook': '#1877F2',
    'X': '#000000',
    'Pinterest': '#BD081C'
  };

  return (
    <div className="sentiment-section">
      <div className="sentiment-header-section">
        <h2 className="sentiment-title">Comment Sentiment Analysis</h2>
        <div className="sentiment-filters">
          {['All', 'positive', 'neutral', 'negative'].map(filter => (
            <button
              key={filter}
              className={`sentiment-filter-btn ${filterSentiment === filter ? 'active' : ''}`}
              onClick={() => setFilterSentiment(filter)}
              style={{ 
                borderColor: filter !== 'All' ? getSentimentColor(filter) : 'transparent',
                color: filterSentiment === filter ? 'white' : '#ffffff'
              }}
            >
              {filter !== 'All' && <span>{getSentimentIcon(filter)}</span>}
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="sentiment-stats-grid">
        <div className="sentiment-stat-card positive">
          <div className="stat-icon">{getSentimentIcon('positive')}</div>
          <div className="stat-content">
            <span className="stat-label">Positive</span>
            <span className="stat-value">{overallStats.positive}%</span>
          </div>
        </div>
        <div className="sentiment-stat-card neutral">
          <div className="stat-icon">{getSentimentIcon('neutral')}</div>
          <div className="stat-content">
            <span className="stat-label">Neutral</span>
            <span className="stat-value">{overallStats.neutral}%</span>
          </div>
        </div>
        <div className="sentiment-stat-card negative">
          <div className="stat-icon">{getSentimentIcon('negative')}</div>
          <div className="stat-content">
            <span className="stat-label">Negative</span>
            <span className="stat-value">{overallStats.negative}%</span>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-section">
        <h3 className="comments-title">Recent Comments ({filteredComments.length})</h3>
        <div className="comments-grid">
          {filteredComments.map(comment => (
            <motion.div 
              key={comment.id} 
              className="comment-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="comment-header">
                <div className="comment-author-info">
                  <span className="sentiment-badge" style={{ backgroundColor: getSentimentColor(comment.sentiment) + '22', color: getSentimentColor(comment.sentiment) }}>
                    {getSentimentIcon(comment.sentiment)}
                  </span>
                  <div className="author-details">
                    <span className="author-name">{comment.author}</span>
                    <span className="platform-tag" style={{ backgroundColor: (platformColors[comment.platform] || '#747474') + '22', color: platformColors[comment.platform] || '#747474' }}>
                      {comment.platform}
                    </span>
                  </div>
                </div>
                <div className="comment-meta">
                  <span className="sentiment-score" style={{ color: getSentimentColor(comment.sentiment) }}>
                    {Math.round(comment.score * 100)}%
                  </span>
                </div>
              </div>
              <div className="comment-text">{comment.text}</div>
              <div className="comment-footer">
                <span className="timestamp">{comment.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
