import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './SimulatorPage.css';

export default function SimulatorPage() {
  const [formData, setFormData] = useState({
    conceptTitle: '',
    description: '',
    targetPlatform: 'All Platforms',
    plannedDuration: '7'
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const platforms = [
    { value: 'All Platforms', color: '#2075E6' },
    { value: 'Instagram', color: '#E1306C' },
    { value: 'Facebook', color: '#1877F2' },
    { value: 'X / Twitter', color: '#000000' },
    { value: 'Pinterest', color: '#BD081C' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.conceptTitle.trim()) {
      setError('Please enter a concept title');
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('http://localhost:5000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTitle: formData.conceptTitle,
          description: formData.description,
          targetPlatform: formData.targetPlatform,
          plannedDuration: parseInt(formData.plannedDuration)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Simulation failed');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message || 'Failed to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      conceptTitle: '',
      description: '',
      targetPlatform: 'All Platforms',
      plannedDuration: '7'
    });
    setPrediction(null);
    setError(null);
  };

  const selectedPlatformColor = platforms.find(p => p.value === formData.targetPlatform)?.color || '#2075E6';

  return (
    <div className="simulator-container">
      <div className="simulator-header">
        <h1>What-If Simulator</h1>
        <p className="subtitle">Predict future performance based on historical patterns</p>
      </div>

      <div className="simulator-content">
        {/* Form Section */}
        <motion.div 
          className="simulator-form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2>Simulation Parameters</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="conceptTitle">Concept Title</label>
              <input
                id="conceptTitle"
                type="text"
                placeholder="e.g., Summer Collection Launch"
                value={formData.conceptTitle}
                onChange={(e) => setFormData({ ...formData, conceptTitle: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Describe your content concept, goals, and strategy..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetPlatform">Target Platform</label>
              <select
                id="targetPlatform"
                value={formData.targetPlatform}
                onChange={(e) => setFormData({ ...formData, targetPlatform: e.target.value })}
                style={{ borderLeftColor: selectedPlatformColor }}
              >
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="plannedDuration">Planned Duration (Days)</label>
              <div className="duration-chips">
                {[7, 15, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    className={`duration-chip ${formData.plannedDuration === days.toString() ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, plannedDuration: days.toString() })}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="reset-btn" onClick={handleReset}>
                Reset
              </button>
              <button type="submit" className="simulate-btn" disabled={loading}>
                {loading ? 'Analyzing...' : 'Run Simulation'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Prediction Card */}
        {error && (
          <motion.div
            className="error-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </motion.div>
        )}

        {prediction && (
          <motion.div
            className="prediction-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="prediction-header">
              <h2>Prediction Results</h2>
              <div 
                className="platform-badge"
                style={{ backgroundColor: selectedPlatformColor + '22', color: selectedPlatformColor }}
              >
                {prediction.targetPlatform}
              </div>
            </div>

            <div className="prediction-metrics">
              <div className="metric-box">
                <span className="metric-label">Estimated Reach</span>
                <span className="metric-value">{prediction.prediction.reach.toLocaleString()}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">View Count</span>
                <span className="metric-value">{prediction.prediction.viewCount.toLocaleString()}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Engagement Rate</span>
                <span className="metric-value">{prediction.prediction.engagementRate.toFixed(2)}%</span>
              </div>
            </div>

            <div className="confidence-section">
              <div className="confidence-header">
                <span>Confidence Score</span>
                <span className="confidence-value">{prediction.prediction.confidenceScore}%</span>
              </div>
              <div className="confidence-bar">
                <motion.div
                  className="confidence-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.prediction.confidenceScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ backgroundColor: selectedPlatformColor }}
                />
              </div>
            </div>

            <div className="reasoning-section">
              <h3>Reasoning</h3>
              <p>{prediction.prediction.reasoning}</p>
            </div>

            {prediction.description && (
              <div className="description-section">
                <h3>Concept Description</h3>
                <p>{prediction.description}</p>
              </div>
            )}

            <div className="prediction-footer">
              <span className="concept-title">"{prediction.conceptTitle}"</span>
              <span className="duration-badge">{prediction.plannedDuration} days</span>
            </div>
          </motion.div>
        )}

        {!prediction && !error && !loading && (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-icon">🔮</div>
            <p>Fill in the form above to generate a performance prediction</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
