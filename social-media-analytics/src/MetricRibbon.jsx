import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { subDays, isWithinInterval, parseISO } from 'date-fns';
import './MetricRibbon.css';
import TrendGraph from './TrendGraph';
import PlatformGrid from './PlatformGrid';
// Importing all dataset chunks
import c001 from './data/content_C001_performance.json';
import c002 from './data/content_C002_performance.json';
import c003 from './data/content_C003_performance.json';
import c004 from './data/content_C004_performance.json';
import c005 from './data/content_C005_performance.json';
import c006 from './data/content_C006_performance.json';

// Merge all data into one master array for cross-content calculation
const allData = [...c001, ...c002, ...c003, ...c004, ...c005, ...c006];

const MetricRibbon = ({ selectedPeriod}) => {
  const [selectedMetric, setSelectedMetric] = useState('Reach');

  const stats = useMemo(() => {
    // 1. Get the latest date from the entire dataset
    const latestDate = parseISO(allData.reduce((max, p) => p.date > max ? p.date : max, allData[0].date));
    
    // 2. Define Time Windows
    const periodMap = {
  'Last 7 Days': 7,
  'Last 15 Days': 15,
  'Last 30 Days': 30,
  'Last 60 Days': 60,
  'Last 90 Days': 90
};

// Use the map, or default to 7 if the key isn't found
const daysToSubtract = periodMap[selectedPeriod]||7;
    const currentStart = subDays(latestDate, daysToSubtract);
    const prevStart = subDays(currentStart, daysToSubtract);

    const calculateMetrics = (start, end) => {
      const filtered = allData.filter(d => 
        isWithinInterval(parseISO(d.date), { start, end })
      );

      return {
        "New Followers": filtered.reduce((acc, curr) => acc + (curr.new_followers || 0), 0),
        "Likes": filtered.reduce((acc, curr) => acc + (curr.view_count * (curr.like_rate / 100)), 0),
        "Comments": filtered.reduce((acc, curr) => acc + (curr.view_count * (curr.comment_rate / 100)), 0),
        "Reach": filtered.reduce((acc, curr) => acc + (curr.reach || 0), 0),
        "Impressions": filtered.reduce((acc, curr) => acc + (curr.view_count || 0), 0),
        "Shares": filtered.reduce((acc, curr) => acc + (curr.view_count * (curr.share_rate / 100)), 0),
        "Saves": filtered.reduce((acc, curr) => acc + (curr.view_count * (curr.save_rate / 100)), 0),
      };
    };

    const currentPeriod = calculateMetrics(currentStart, latestDate);
    const previousPeriod = calculateMetrics(prevStart, currentStart);

    return Object.keys(currentPeriod).map(key => {
      const curVal = currentPeriod[key];
      const preVal = previousPeriod[key];
      const percentChange = preVal === 0 ? 0 : ((curVal - preVal) / preVal) * 100;

      return {
        label: key,
        value: Math.round(curVal),
        change: parseFloat(percentChange.toFixed(1))
      };
    });
  }, [selectedPeriod]);

  return (
    <>
    <div className="ribbon-container">
      <div className="metric-ribbon">
        {stats.map((item) => {
          const isSelected = selectedMetric === item.label;
          const isPositive = item.change >= 0;

          return (
            <div 
              key={item.label}
              className={`metric-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedMetric(item.label)}
            >
              <span className="label">{item.label}</span>
              <span className="value">{item.value.toLocaleString()}</span>
              <div className={`change-indicator ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(item.change)}%
              </div>
              
              {isSelected && (
                <motion.div 
                  layoutId="blue-border"
                  className="card-selection-border"
                  transition={{ type: "tween", stiffness: 100, damping: 60 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
    <TrendGraph selectedMetric={selectedMetric} selectedPeriod={selectedPeriod} />
    <div className="platform-breakdown-section">
        
        <PlatformGrid 
          selectedMetric={selectedMetric} 
          selectedPeriod={selectedPeriod} 
        />
      </div>
    </>
  );
};

export default MetricRibbon;