
import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import StatusCard from '@/components/dashboard/StatusCard';
import SensorData from '@/components/dashboard/SensorData';
import ActivityPrediction from '@/components/dashboard/ActivityPrediction';
import AccelerometerGraph from '@/components/dashboard/AccelerometerGraph';
import ControlPanel from '@/components/dashboard/ControlPanel';
import { useActivityData } from '@/hooks/useActivityData';

const Index = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  
  const { 
    connected, 
    batteryLevel, 
    accelerometerData, 
    activityPrediction, 
    timeSeriesData,
    resetData 
  } = useActivityData(isStreaming);

  const handleToggleStreaming = () => {
    setIsStreaming(prev => !prev);
  };

  const handleReset = () => {
    if (!isStreaming) {
      resetData();
    }
  };

  return (
    <div className="min-h-screen bg-tech-background">
      <div className="container mx-auto px-4 py-6 animate-fade-in">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <StatusCard isConnected={connected} batteryLevel={batteryLevel} />
          <SensorData 
            x={accelerometerData.x} 
            y={accelerometerData.y} 
            z={accelerometerData.z} 
          />
          <ActivityPrediction 
            currentActivity={activityPrediction.activity} 
            confidence={activityPrediction.confidence} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <AccelerometerGraph data={timeSeriesData} />
          </div>
          <div className="lg:col-span-1">
            <ControlPanel 
              isStreaming={isStreaming} 
              onToggleStreaming={handleToggleStreaming} 
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
