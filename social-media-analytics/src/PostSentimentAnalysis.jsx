import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Sentiment from 'sentiment';
import './PostSentimentAnalysis.css';

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Sentiment analyzer function
const analyzeSentiment = (text) => {
  // Remove emojis and special characters for better analysis
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Analyze sentiment
  const result = sentiment.analyze(cleanText);
  
  // Normalize score to 0-1 range
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

// Mock comments data for each post (in real app, this would come from API)
const getPostComments = (postId) => {
  // Generate different comments for different posts
  const allComments = [
    { id: 1, text: "Love this! So inspiring", platform: "Instagram", author: "@user123", timestamp: "2h ago" },
    { id: 2, text: "This is exactly what I needed today", platform: "Facebook", author: "John Doe", timestamp: "3h ago" },
    { id: 3, text: "Not really my style but looks good", platform: "Instagram", author: "@user456", timestamp: "4h ago" },
    { id: 4, text: "Amazing work! Keep it up!", platform: "Pinterest", author: "Jane Smith", timestamp: "5h ago" },
    { id: 5, text: "Could be better", platform: "Instagram", author: "@user789", timestamp: "6h ago" },
    { id: 6, text: "This is fantastic!", platform: "Facebook", author: "Mike Johnson", timestamp: "7h ago" },
    { id: 7, text: "I don't understand the hype", platform: "X", author: "@critic123", timestamp: "8h ago" },
    { id: 8, text: "Pretty good content", platform: "Instagram", author: "@user321", timestamp: "9h ago" },
    { id: 9, text: "Absolutely brilliant!", platform: "Pinterest", author: "Sarah Lee", timestamp: "10h ago" },
    { id: 10, text: "Nothing special", platform: "Instagram", author: "@user654", timestamp: "11h ago" },
    { id: 11, text: "Wow, this actually changed how I think about it", platform: "Instagram", author: "@mindshift", timestamp: "12h ago" },
    { id: 12, text: "Nice visuals but the message feels rushed", platform: "Instagram", author: "@visualjunkie", timestamp: "13h ago" },
    { id: 13, text: "This is misleading and poorly explained", platform: "X", author: "@skeptical_sam", timestamp: "14h ago" },
    { id: 14, text: "Saved this for later, super helpful", platform: "Pinterest", author: "Emily Carter", timestamp: "15h ago" },
    { id: 15, text: "Why is everyone praising this? It's average at best.", platform: "X", author: "@unimpressed", timestamp: "16h ago" }
  ];
  
  // Return a subset based on postId to simulate different comments per post
  const startIndex = (postId.charCodeAt(postId.length - 1) - 48) % allComments.length;
  return allComments.slice(startIndex, startIndex + 8);
};

const PostSentimentAnalysis = ({ postId }) => {
  const [filterSentiment, setFilterSentiment] = useState('All');
  
  // Get comments for this post
  const postComments = useMemo(() => getPostComments(postId), [postId]);
  
  // Analyze all comments and add sentiment/score
  const analyzedComments = useMemo(() => {
    return postComments.map(comment => {
      const analysis = analyzeSentiment(comment.text);
      return {
        ...comment,
        sentiment: analysis.sentiment,
        score: analysis.score
      };
    });
  }, [postComments]);
  
  // Calculate overall stats from analyzed comments
  const overallStats = useMemo(() => {
    const total = analyzedComments.length;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
    
    const positive = analyzedComments.filter(c => c.sentiment === 'positive').length;
    const negative = analyzedComments.filter(c => c.sentiment === 'negative').length;
    const neutral = analyzedComments.filter(c => c.sentiment === 'neutral').length;
    
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
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

  const getSentimentLabel = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'POS';
      case 'negative': return 'NEG';
      default: return 'NEU';
    }
  };

  const platformColors = {
    'Instagram': '#E1306C',
    'Facebook': '#1877F2',
    'X': '#000000',
    'Pinterest': '#BD081C'
  };

  if (analyzedComments.length === 0) {
    return null;
  }

  return (
    <div className="post-sentiment-section">
      <div className="post-sentiment-header">
        <h3 className="post-sentiment-title">Comment Sentiment</h3>
        <div className="post-sentiment-filters">
          {['All', 'positive', 'neutral', 'negative'].map(filter => (
            <button
              key={filter}
              className={`post-sentiment-filter-btn ${filterSentiment === filter ? 'active' : ''}`}
              onClick={() => setFilterSentiment(filter)}
              style={{ 
                borderColor: filter !== 'All' ? getSentimentColor(filter) : 'transparent'
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="post-sentiment-stats">
        <div className="post-stat-card positive">
          <div className="post-stat-indicator" style={{ backgroundColor: getSentimentColor('positive') }}></div>
          <div className="post-stat-content">
            <span className="post-stat-label">Positive</span>
            <span className="post-stat-value">{overallStats.positive}%</span>
          </div>
        </div>
        <div className="post-stat-card neutral">
          <div className="post-stat-indicator" style={{ backgroundColor: getSentimentColor('neutral') }}></div>
          <div className="post-stat-content">
            <span className="post-stat-label">Neutral</span>
            <span className="post-stat-value">{overallStats.neutral}%</span>
          </div>
        </div>
        <div className="post-stat-card negative">
          <div className="post-stat-indicator" style={{ backgroundColor: getSentimentColor('negative') }}></div>
          <div className="post-stat-content">
            <span className="post-stat-label">Negative</span>
            <span className="post-stat-value">{overallStats.negative}%</span>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="post-comments-section">
        <div className="post-comments-header">
          <span className="post-comments-count">{filteredComments.length} Comments</span>
        </div>
        <div className="post-comments-list">
          {filteredComments.map(comment => (
            <motion.div 
              key={comment.id} 
              className="post-comment-item"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="post-comment-header-row">
                <div className="post-comment-author-section">
                  <div className="post-sentiment-indicator-wrapper">
                    <div 
                      className="post-sentiment-indicator" 
                      style={{ backgroundColor: getSentimentColor(comment.sentiment) }}
                    >
                      <span className="post-sentiment-label">{getSentimentLabel(comment.sentiment)}</span>
                    </div>
                  </div>
                  <div className="post-comment-author-details">
                    <span className="post-comment-author">{comment.author}</span>
                    <span 
                      className="post-comment-platform" 
                      style={{ color: platformColors[comment.platform] || '#747474' }}
                    >
                      {comment.platform}
                    </span>
                  </div>
                </div>
                <div className="post-comment-meta">
                  <span className="post-comment-score" style={{ color: getSentimentColor(comment.sentiment) }}>
                    {Math.round(comment.score * 100)}%
                  </span>
                  <span className="post-comment-time">{comment.timestamp}</span>
                </div>
              </div>
              <div className="post-comment-text">{comment.text}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostSentimentAnalysis;
