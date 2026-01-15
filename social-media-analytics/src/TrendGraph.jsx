import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';
import './TrendGraph.css';

// Importing datasets (Ensuring consistency with your Ribbon)
import c001 from './data/content_C001_performance.json';
import c002 from './data/content_C002_performance.json';
import c003 from './data/content_C003_performance.json';
import c004 from './data/content_C004_performance.json';
import c005 from './data/content_C005_performance.json';
import c006 from './data/content_C006_performance.json';

const allData = [...c001, ...c002, ...c003, ...c004, ...c005, ...c006];

const TrendGraph = ({ selectedMetric, selectedPeriod }) => {
  const chartData = useMemo(() => {
    // 1. Determine Date Range
    const latestDate = parseISO(allData.reduce((max, p) => p.date > max ? p.date : max, allData[0].date));
    const periodMap = { 'Last 7 Days': 7, 'Last 15 Days': 15, 'Last 30 Days': 30, 'Last 60 Days': 60, 'Last 90 Days': 90 };
    const daysToSubtract = periodMap[selectedPeriod] || 7;
    const startDate = subDays(latestDate, daysToSubtract);

    // 2. Filter and Group by Date (Summing all platforms/contents per day)
    const dailyMap = allData.reduce((acc, curr) => {
      const dateKey = curr.date;
      if (!isWithinInterval(parseISO(dateKey), { start: startDate, end: latestDate })) return acc;

      if (!acc[dateKey]) acc[dateKey] = 0;

      // Logic to calculate specific metric value per entry
      let val = 0;
      switch (selectedMetric) {
        case 'New Followers': val = curr.new_followers || 0; break;
        case 'Likes': val = curr.view_count * (curr.like_rate / 100); break;
        case 'Comments': val = curr.view_count * (curr.comment_rate / 100); break;
        case 'Reach': val = curr.reach || 0; break;
        case 'Impressions': val = curr.view_count || 0; break;
        case 'Shares': val = curr.view_count * (curr.share_rate / 100); break;
        case 'Saves': val = curr.view_count * (curr.save_rate / 100); break;
        default: val = 0;
      }
      
      acc[dateKey] += val;
      return acc;
    }, {});

    // 3. Convert to Array and Sort by Date
    return Object.keys(dailyMap)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date: format(parseISO(date), 'MMM dd'),
        fullDate: format(parseISO(date), 'MMMM dd, yyyy'),
        value: Math.round(dailyMap[date])
      }));
  }, [selectedMetric, selectedPeriod]);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{payload[0].payload.fullDate}</p>
          <p className="tooltip-value">
            <span className="dot"></span>
            {selectedMetric}: <strong>{payload[0].value.toLocaleString()}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3>{selectedMetric} Trend</h3>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendGraph;