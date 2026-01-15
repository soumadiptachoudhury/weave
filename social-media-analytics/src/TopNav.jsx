import React, { useState } from 'react';
import './TopNav.css';
import Pulse from './Pulse';
import PostGrid from './PostManager';
import ChatbotPage from './ChatbotPage';
import SimulatorPage from './SimulatorPage';

const TopNav = () => {
  const [activeMode, setActiveMode] = useState('Pulse');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const platforms = [
    { name: 'Instagram', status: 'Connected', color: '#E1306C' },
    { name: 'Facebook', status: 'Connected', color: '#1877F2' },
    { name: 'X / Twitter', status: 'Disconnected', color: '#000000' },
    { name: 'Pinterest', status: 'Connected', color: '#BD081C' },
  ];

  return (
    <>
      <nav className="top-nav">
        <div className="nav-container">
          {/* Left Side (Logo Placeholder) */}
          {/* <div className="nav-brand">Dashboard</div> */}

          {/* Center: Mode Switcher */}
          <div style={{color:'white'}}>Third Eye</div>
          <div className='css-wrapper'>
          <div className="mode-switcher">
            {['Pulse', 'Posts', 'Oracle', 'Simulator'].map((mode) => (
              <button
                key={mode}
                className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
                onClick={() => setActiveMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Right Side: Avatar */}
          <div className="nav-user">
            <div 
              className="avatar-circle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              AB
            </div>
          </div>
          </div>
        </div>

        {/* Side Menu Overlay */}
        {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)} />}
        
        {/* Slide-out Menu */}
        <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="menu-header">
            <h3 style={{color:'white'}}>Connections</h3>
            <button className="close-btn" onClick={() => setIsMenuOpen(false)}>&times;</button>
          </div>

          <div className="platform-list">
            {platforms.map((p) => (
              <div key={p.name} className="platform-item">
                <div className="platform-info">
                  <span className="status-dot" style={{ backgroundColor: p.status === 'Connected' ? '#10b981' : '#ef4444' }}></span>
                  <span className="platform-name">{p.name}</span>
                </div>
                <span className="platform-status">{p.status}</span>
              </div>
            ))}
          </div>

          <div className="menu-actions">
            <button className="add-btn">+ Add Connection</button>
            <button className="logout-btn">Log Out</button>
          </div>
        </div>
      </nav>
      {activeMode === 'Pulse' && <Pulse />}
      {activeMode === 'Posts' && <PostGrid/>}
      {activeMode === 'Oracle' && <ChatbotPage />}
      {activeMode === 'Simulator' && <SimulatorPage />}
    </>
  );
};

export default TopNav;