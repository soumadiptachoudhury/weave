import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subDays, isWithinInterval, parseISO, format } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts';
import './PostManager.css';

// Data imports (Ensure these files exist in your project)
import metadata from './data/content_metadata.json';
import c001 from './data/content_C001_performance.json';
import c002 from './data/content_C002_performance.json';
import c003 from './data/content_C003_performance.json';
import c004 from './data/content_C004_performance.json';
import c005 from './data/content_C005_performance.json';
import c006 from './data/content_C006_performance.json';

const allPerformance = { C001: c001, C002: c002, C003: c003, C004: c004, C005: c005, C006: c006 };

export default function PostsManager() {
  const [timePeriod, setTimePeriod] = useState(30);
  const [platform, setPlatform] = useState('All');
  const [catalogSort, setCatalogSort] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  // 1. DATA ENGINE: Aggregates everything per post
  const processedPosts = useMemo(() => {
    const latestDate = parseISO("2026-01-13");
    const startDate = subDays(latestDate, timePeriod);

    return metadata.map(meta => {
      const perf = (allPerformance[meta.content_id] || []).filter(d => {
        const dateMatch = isWithinInterval(parseISO(d.date), { start: startDate, end: latestDate });
        // FIXED: JSON uses lowercase 'instagram', 'facebook', etc.
        const platMatch = platform === 'All' || d.platform.toLowerCase() === platform.toLowerCase();
        return dateMatch && platMatch;
      });

      const count = perf.length || 1;
      const views = perf.reduce((acc, c) => acc + (c.view_count || 0), 0);
      const reach = perf.reduce((acc, c) => acc + (c.reach || 0), 0);
      const followers = perf.reduce((acc, c) => acc + (c.new_followers || 0), 0);
      
      const likes = perf.reduce((acc, c) => acc + (c.view_count * (c.like_rate || 0) / 100), 0);
      const comments = perf.reduce((acc, c) => acc + (c.view_count * (c.comment_rate || 0) / 100), 0);
      const shares = perf.reduce((acc, c) => acc + (c.view_count * (c.share_rate || 0) / 100), 0);
      const saves = perf.reduce((acc, c) => acc + (c.view_count * (c.save_rate || 0) / 100), 0);
      
      const skipRate = perf.reduce((acc, c) => acc + (c.skip_rate || 0), 0) / count;
      const watchTime = perf.reduce((acc, c) => acc + (c.average_watch_time || 0), 0) / count;

      return {
        ...meta,
        views: Math.round(views),
        reach: Math.round(reach),
        followers: Math.round(followers),
        likes: Math.round(likes),
        comments: Math.round(comments),
        shares: Math.round(shares),
        saves: Math.round(saves),
        skip_rate: parseFloat(skipRate.toFixed(1)),
        avg_watch_time: parseFloat(watchTime.toFixed(1)),
        like_rate: views > 0 ? parseFloat(((likes / views) * 100).toFixed(2)) : 0,
        share_rate: views > 0 ? parseFloat(((shares / views) * 100).toFixed(2)) : 0,
        comment_rate: views > 0 ? parseFloat(((comments / views) * 100).toFixed(2)) : 0,
        save_rate: views > 0 ? parseFloat(((saves / views) * 100).toFixed(2)) : 0,
        engRate: reach > 0 ? parseFloat((((likes + comments + shares + saves) / reach) * 100).toFixed(2)) : 0
      };
    });
  }, [timePeriod, platform]);

  // 2. LIBRARY AVERAGES (for indicators)
  const libAvgs = useMemo(() => {
    const keys = ['reach', 'views', 'engRate', 'likes', 'followers', 'avg_watch_time', 'skip_rate', 'like_rate', 'share_rate', 'save_rate'];
    const avgs = {};
    keys.forEach(k => avgs[k] = processedPosts.reduce((acc, p) => acc + (p[k] || 0), 0) / processedPosts.length);
    return avgs;
  }, [processedPosts]);

  const filteredCatalog = useMemo(() => {
    let list = [...processedPosts].filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic sorting based on dropdown selection
  switch (catalogSort) {
    case 'Most Engagement': list.sort((a, b) => b.engRate - a.engRate); break;
    case 'Most Reach': list.sort((a, b) => b.reach - a.reach); break;
    case 'Most Views': list.sort((a, b) => b.views - a.views); break;
    case 'Most Likes': list.sort((a, b) => b.likes - a.likes); break;
    case 'Most Shares': list.sort((a, b) => b.shares - a.shares); break;
    case 'Most Saves': list.sort((a, b) => b.saves - a.saves); break;
    case 'Most Followers': list.sort((a, b) => b.followers - a.followers); break;
    case 'Highest Retention': list.sort((a, b) => a.skip_rate - b.skip_rate); break; // Lowest is best
    case 'Longest Watch Time': list.sort((a, b) => b.avg_watch_time - a.avg_watch_time); break;
    default: break; // 'All' or default
  }
  
  return list;
}, [processedPosts, catalogSort, searchQuery]);

  const top3 = [...processedPosts].sort((a, b) => b.reach - a.reach).slice(0, 3);
  const bottom3 = [...processedPosts].sort((a, b) => a.reach - b.reach).slice(0, 3);

  return (
    <div className="posts-container-dark">
      <header className="main-header">
  <div>
    <h1>Content Lab</h1>
    <p className="subtitle">Real-time Performance Analysis</p>
  </div>
  
  <div className="header-controls">
    {/* Time Period Selector */}
    <div className="time-chips">
      {[7, 15, 30].map(days => (
        <button 
          key={days} 
          className={`chip ${timePeriod === days ? 'active' : ''}`}
          onClick={() => setTimePeriod(days)}
        >
          {days}D
        </button>
      ))}
    </div>

    {/* Platform Selector */}
    <select className="dark-select" value={platform} onChange={e => setPlatform(e.target.value)}>
      <option value="All">All Platforms</option>
      <option value="Instagram">Instagram</option>
      <option value="Facebook">Facebook</option>
      <option value="X">X (Twitter)</option>
      <option value="Pinterest">Pinterest</option>
    </select>
  </div>
</header>

      <section className="ranking-section">
        <h2 className="sec-title">Top Performance</h2>
        <div className="performance-grid">
          {top3.map(p => <RankingCard key={p.content_id} post={p} onOpen={() => setSelectedPost(p)} />)}
        </div>
        
        <h2 className="sec-title mt-40">Least Performance</h2>
        <div className="performance-grid">
          {bottom3.map(p => <RankingCard key={p.content_id} post={p} isLeast onOpen={() => setSelectedPost(p)} />)}
        </div>
      </section>

      <section className="catalog-section">
        <div className="catalog-toolbar">
          <select 
  className="catalog-sort-dropdown" 
  value={catalogSort} 
  onChange={e => setCatalogSort(e.target.value)}
>
  <option value="All">All Library (Default)</option>
  <optgroup label="Volume Metrics">
    <option value="Most Reach">Most Reach</option>
    <option value="Most Views">Most Views</option>
    <option value="Most Followers">Most Followers</option>
  </optgroup>
  <optgroup label="Interactions">
    <option value="Most Engagement">Highest Eng. Rate</option>
    <option value="Most Likes">Most Likes</option>
    <option value="Most Shares">Most Shares</option>
    <option value="Most Saves">Most Saves</option>
  </optgroup>
  <optgroup label="Retention & Quality">
    <option value="Highest Retention">Lowest Skip Rate</option>
    <option value="Longest Watch Time">Longest Watch Time</option>
  </optgroup>
</select>
          <input type="text" placeholder="Search title..." className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="catalog-list">
          {filteredCatalog.map(p => <CatalogRow key={p.content_id} post={p} onOpen={() => setSelectedPost(p)} />)}
        </div>
      </section>

      <AnimatePresence>
        {selectedPost && <PostDetail post={selectedPost} avgs={libAvgs} onClose={() => setSelectedPost(null)} />}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS (DEFINED) ---

const RankingCard = ({ post, isLeast, onOpen }) => (
  <div className={`rank-card ${isLeast ? 'red-border' : 'blue-border'}`} onClick={onOpen}>
    <img src={`/images/posts/${post.content_id}.jpg`} alt="" />
    <div className="rank-card-body">
      <h3>{post.title}</h3>
      <p className="truncate-text">{post.description}</p>
      <div className="rank-card-footer">
        <span className="er-stat">ER: {post.engRate}%</span>
        <div className="mini-stats">
          <span>❤️ {post.likes}</span>
          <span>💬 {post.comments}</span>
          <span>🔗 {post.shares}</span>
        </div>
      </div>
    </div>
  </div>
);

const CatalogRow = ({ post, onOpen }) => (
  <div className="catalog-row" onClick={onOpen}>
    <img src={`/images/posts/${post.content_id}.jpg`} alt="" />
    <div className="cat-info">
      <h4>{post.title}</h4>
      <p className="truncate-text">{post.description}</p>
    </div>
    <div className="cat-metrics">
      <div className="m-item"><span>Likes</span>{post.likes}</div>
      <div className="m-item"><span>Comm.</span>{post.comments}</div>
      <div className="m-item"><span>Shares</span>{post.shares}</div>
      <div className="m-item"><span>Saves</span>{post.saves}</div>
      <div className="m-item blue"><span>ER</span>{post.engRate}%</div>
    </div>
  </div>
);

const PostDetail = ({ post, avgs, onClose }) => {
  const [activeMetric, setActiveMetric] = useState('reach');
  const [dPlat, setDPlat] = useState('All');
  const [detailTime, setDetailTime] = useState(30);

  // 1. LOCAL STATS ENGINE: Recalculates tiles based on popup filters
  const localStats = useMemo(() => {
    const end = parseISO("2026-01-13");
    const start = subDays(end, detailTime);
    
    const filteredPerf = (allPerformance[post.content_id] || []).filter(d => {
      const dm = isWithinInterval(parseISO(d.date), { start, end });
      const pm = dPlat === 'All' || d.platform.toLowerCase() === dPlat.toLowerCase();
      return dm && pm;
    });

    const count = filteredPerf.length || 1;
    const views = filteredPerf.reduce((acc, c) => acc + (c.view_count || 0), 0);
    const reach = filteredPerf.reduce((acc, c) => acc + (c.reach || 0), 0);
    const followers = filteredPerf.reduce((acc, c) => acc + (c.new_followers || 0), 0);
    
    // Summing interactions
    const likes = filteredPerf.reduce((acc, c) => acc + (c.view_count * (c.like_rate || 0) / 100), 0);
    const comments = filteredPerf.reduce((acc, c) => acc + (c.view_count * (c.comment_rate || 0) / 100), 0);
    const shares = filteredPerf.reduce((acc, c) => acc + (c.view_count * (c.share_rate || 0) / 100), 0);
    const saves = filteredPerf.reduce((acc, c) => acc + (c.view_count * (c.save_rate || 0) / 100), 0);
    
    const skipRate = filteredPerf.reduce((acc, c) => acc + (c.skip_rate || 0), 0) / count;
    const watchTime = filteredPerf.reduce((acc, c) => acc + (c.average_watch_time || 0), 0) / count;

    return {
      reach: Math.round(reach),
      views: Math.round(views),
      likes: Math.round(likes),
      followers: Math.round(followers),
      avg_watch_time: parseFloat(watchTime.toFixed(1)),
      skip_rate: parseFloat(skipRate.toFixed(1)),
      like_rate: views > 0 ? parseFloat(((likes / views) * 100).toFixed(2)) : 0,
      share_rate: views > 0 ? parseFloat(((shares / views) * 100).toFixed(2)) : 0,
      save_rate: views > 0 ? parseFloat(((saves / views) * 100).toFixed(2)) : 0,
      engRate: reach > 0 ? parseFloat((((likes + comments + shares + saves) / reach) * 100).toFixed(2)) : 0
    };
  }, [post.content_id, dPlat, detailTime]);

  // 2. GRAPH DATA ENGINE (Mapping for the line chart)
  const graphData = useMemo(() => {
    const end = parseISO("2026-01-13");
    const start = subDays(end, detailTime);
    
    const raw = (allPerformance[post.content_id] || []).filter(d => {
      const dm = isWithinInterval(parseISO(d.date), { start, end });
      const pm = dPlat === 'All' || d.platform.toLowerCase() === dPlat.toLowerCase();
      return dm && pm;
    });

    const daily = {};
    raw.forEach(entry => {
      const key = format(parseISO(entry.date), 'MMM dd');
      if (!daily[key]) daily[key] = 0;
      
      // Logic to pick the right value for the graph
      if (activeMetric === 'reach') daily[key] += entry.reach;
      else if (activeMetric === 'views') daily[key] += entry.view_count;
      else if (activeMetric === 'avg_watch_time') daily[key] += entry.average_watch_time;
      else if (activeMetric === 'followers') daily[key] += entry.new_followers;
      else if (activeMetric === 'skip_rate') daily[key] += entry.skip_rate;
      else if (activeMetric === 'likes') daily[key] += (entry.view_count * (entry.like_rate || 0) / 100);
      else if (activeMetric === 'engRate') {
         const interactions = (entry.view_count * (entry.like_rate + entry.comment_rate + entry.share_rate + entry.save_rate) / 100);
         daily[key] += entry.reach > 0 ? (interactions / entry.reach) * 100 : 0;
      }
      else daily[key] += entry[activeMetric] || 0;
    });

    return Object.keys(daily)
      .sort((a, b) => parseISO(a) - parseISO(b))
      .map(d => ({ date: d, val: parseFloat(daily[d].toFixed(2)) }));
  }, [post.content_id, activeMetric, dPlat, detailTime]);

  const metricList = [
    { label: 'Reach', key: 'reach' },
    { label: 'Views', key: 'views' },
    { label: 'Likes', key: 'likes' },
    { label: 'Engagement', key: 'engRate', unit: '%' },
    { label: 'Followers', key: 'followers' },
    { label: 'Watch Time', key: 'avg_watch_time', unit: 's' },
    { label: 'Skip Rate', key: 'skip_rate', unit: '%', reverse: true },
    { label: 'Like Rate', key: 'like_rate', unit: '%' },
    { label: 'Share Rate', key: 'share_rate', unit: '%' },
    { label: 'Save Rate', key: 'save_rate', unit: '%' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="detail-box" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="detail-side">
          <img src={`/images/posts/${post.content_id}.jpg`} alt="" />
          <h2>{post.title}</h2>
          
          <div className="side-controls">
            <label>Platform</label>
            <select className="dark-select full" value={dPlat} onChange={e => setDPlat(e.target.value)}>
              <option value="All">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="X">X (Twitter)</option>
              <option value="Pinterest">Pinterest</option>
            </select>

            <label>Analysis Period</label>
            <div className="time-chips full-width">
              {[7, 30, 90].map(days => (
                <button 
                  key={days} 
                  className={`chip ${detailTime === days ? 'active' : ''}`}
                  onClick={() => setDetailTime(days)}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>Close Detail</button>
        </div>
        
        <div className="detail-main">
          <div className="grid-metrics">
            {metricList.map(m => (
              <MetricTile 
                key={m.key}
                label={m.label}
                // FIXED: Now uses localStats instead of post
                value={localStats[m.key]} 
                unit={m.unit || ''}
                avg={avgs[m.key]}
                reverse={m.reverse}
                active={activeMetric === m.key}
                onClick={() => setActiveMetric(m.key)}
              />
            ))}
          </div>
          
          <div className="graph-area">
             <div className="graph-header">
                <h3>{metricList.find(m => m.key === activeMetric)?.label} Over Time</h3>
             </div>
             <ResponsiveContainer width="100%" height={350}>
                <LineChart data={graphData}>
                  <CartesianGrid stroke="#333" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#777" fontSize={11} />
                  <YAxis stroke="#777" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#222', border: '1px solid #444' }} />
                  <Line type="monotone" dataKey="val" stroke="#2075E6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MetricTile = ({ label, value, unit, avg, reverse, active, onClick }) => {
  const isAbove = value > avg;
  const isGood = reverse ? !isAbove : isAbove;
  const diff = avg > 0 ? Math.abs(((value - avg) / avg) * 100).toFixed(0) : 0;

  return (
    <div className={`m-tile ${isGood ? 'pos' : 'neg'} ${active ? 'active' : ''}`} onClick={onClick}>
       <div className="m-tile-head">
          <label>{label}</label>
          <span className="diff">{isGood ? '▲' : '▼'} {diff}%</span>
       </div>
       <div className="m-tile-val">{value}{unit}</div>
    </div>
  );
};