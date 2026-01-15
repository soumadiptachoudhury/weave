import React, { useState } from 'react';
import TimeSelector from './TimeSelector';
import MetricRibbon from './MetricRibbon';

export default function Pulse() {
  // Lift the state here so both children can access it
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days');

  return (
    <div className='pulse' style={{backgroundColor: 'var(--dark)',padding:'15px', borderRadius:'20px'}}>
      <TimeSelector 
        selectedPeriod={selectedPeriod} 
        setSelectedPeriod={setSelectedPeriod} 
      />
      <MetricRibbon 
        selectedPeriod={selectedPeriod} 
      />
    </div>
  );
}