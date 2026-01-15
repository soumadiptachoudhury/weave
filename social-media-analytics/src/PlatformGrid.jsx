import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { parseISO, isWithinInterval, subDays } from 'date-fns';
import './PlatformGrid.css';

// Re-using the same data strategy
import c001 from './data/content_C001_performance.json';
import c002 from './data/content_C002_performance.json';
import c003 from './data/content_C003_performance.json';
import c004 from './data/content_C004_performance.json';
import c005 from './data/content_C005_performance.json';
import c006 from './data/content_C006_performance.json';

const allData = [...c001, ...c002, ...c003, ...c004, ...c005, ...c006];

const PlatformCard = ({ platform, data, color, selectedMetric }) => {
  return (
    <div className="platform-card">
      <div className="platform-info">
        <div className="platform-meta">
          <span className="platform-name">{platform}</span>
          <h4 className="platform-total">
            {data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
          </h4>
        </div>
        <div className="platform-icon" style={{ backgroundColor: color + '22', color: color }}>
          {/* Simple Initial as Placeholder Icon */}
          {platform.charAt(0)}
        </div>
      </div>
      
      <div className="sparkline-wrapper">
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              dot={false}
              animationDuration={2000}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return <div className="mini-tooltip">{payload[0].value.toLocaleString()}</div>;
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PlatformGrid = ({ selectedMetric, selectedPeriod }) => {
  const platforms = [
    { id: 'instagram', name: 'Instagram', color: '#E1306C' },
    { id: 'facebook', name: 'Facebook', color: '#1877F2' },
    { id: 'x', name: 'X / Twitter', color: '#000000' },
    { id: 'pinterest', name: 'Pinterest', color: '#BD081C' }
  ];

  const processedData = useMemo(() => {
    const latestDate = parseISO(allData.reduce((max, p) => p.date > max ? p.date : max, allData[0].date));
    const periodMap = { 'Last 7 Days': 7, 'Last 15 Days': 15, 'Last 30 Days': 30, 'Last 60 Days': 60, 'Last 90 Days': 90 };
    const daysToSubtract = periodMap[selectedPeriod] || 7;
    const startDate = subDays(latestDate, daysToSubtract);

    return platforms.reduce((acc, plat) => {
      const filtered = allData.filter(d => 
        d.platform.toLowerCase() === plat.id && 
        isWithinInterval(parseISO(d.date), { start: startDate, end: latestDate })
      );

      // Group by date to ensure smooth lines
      const grouped = filtered.reduce((dayAcc, curr) => {
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
        dayAcc[curr.date] = (dayAcc[curr.date] || 0) + val;
        return dayAcc;
      }, {});

      acc[plat.id] = Object.keys(grouped).sort().map(date => ({ value: Math.round(grouped[date]) }));
      return acc;
    }, {});
  }, [selectedMetric, selectedPeriod]);

  return (
    <div className="platform-grid">
      {platforms.map(p => (
        <PlatformCard 
          key={p.id} 
          platform={p.name} 
          color={p.color} 
          data={processedData[p.id] || []}
          selectedMetric={selectedMetric}
        />
      ))}
    </div>
  );
};

export default PlatformGrid;