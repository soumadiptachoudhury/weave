import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TimeSelector.css';

// Receive props from Pulse.jsx
const TimeSelector = ({ selectedPeriod, setSelectedPeriod }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const periods = [
    'Last 7 Days',
    'Last 15 Days',
    'Last 30 Days',
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="time-selector-wrapper" ref={dropdownRef}>
      <button 
        className={`selector-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>{selectedPeriod}</span>
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="chevron-icon" 
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6"></path>
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="dropdown-menu"
          >
            {periods.map((period) => (
              <button
                key={period}
                className={`dropdown-item ${selectedPeriod === period ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPeriod(period); // Updates parent state
                  setIsOpen(false);
                }}
              >
                {period}
                {selectedPeriod === period && (
                  <motion.div layoutId="check" className="check-mark">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimeSelector;