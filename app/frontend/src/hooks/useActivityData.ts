import { useState, useEffect } from 'react';

type Activity = 'walking' | 'running' | 'sitting' | 'standing' | 'lying';
type DataPoint = {
  time: string;
  x: number;
  y: number;
  z: number;
};

export const useActivityData = (isStreaming: boolean) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [accelerometerData, setAccelerometerData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [activityPrediction, setActivityPrediction] = useState<{ activity: Activity | null; confidence: number }>({ 
    activity: null, confidence: 0
  });
  const [timeSeriesData, setTimeSeriesData] = useState<DataPoint[]>([]);
  const [dataUpdateInterval, setDataUpdateInterval] = useState<number | null>(null);

  // Connect/disconnect effect
  useEffect(() => {
    if (isStreaming) {
      setConnected(true);
    } else {
      // When stopping streaming, don't disconnect immediately for better UX
      const disconnectTimeout = setTimeout(() => {
        if (!isStreaming) {
          setConnected(false);
        }
      }, 2000);
      
      return () => clearTimeout(disconnectTimeout);
    }
  }, [isStreaming]);

  // Generate random activity data
  useEffect(() => {
    if (isStreaming) {
      // Clear any existing interval
      if (dataUpdateInterval) {
        clearInterval(dataUpdateInterval);
      }
      
      // Set new interval for data simulation
      const intervalId = window.setInterval(() => {
        // Generate random accelerometer data
        const x = (Math.random() * 20) - 10; // Range: -10 to 10
        const y = (Math.random() * 20) - 10;
        const z = (Math.random() * 20) - 10;
        
        setAccelerometerData({ x, y, z });
        
        // Add to time series data
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        
        setTimeSeriesData(prev => {
          const newData = [...prev, { time: timeString, x, y, z }];
          // Keep only the last 30 data points
          return newData.slice(-30);
        });
        
        // Random activity prediction
        const activities: Activity[] = ['walking', 'running', 'sitting', 'standing', 'lying'];
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const randomConfidence = Math.random() * 40 + 60; // 60% to 100%
        
        setActivityPrediction({
          activity: randomActivity,
          confidence: randomConfidence
        });
        
        // Update battery level (decrease slightly)
        setBatteryLevel(prev => {
          const newLevel = prev - 0.1;
          return newLevel < 0 ? 0 : newLevel;
        });
      }, 1000);
      
      setDataUpdateInterval(intervalId);
      
      return () => {
        clearInterval(intervalId);
        setDataUpdateInterval(null);
      };
    }
  }, [isStreaming]);

  const resetData = () => {
    setTimeSeriesData([]);
    setAccelerometerData({ x: 0, y: 0, z: 0 });
    setActivityPrediction({ activity: null, confidence: 0 });
    setBatteryLevel(85);
  };

  return {
    connected,
    batteryLevel,
    accelerometerData,
    activityPrediction,
    timeSeriesData,
    resetData
  };
};
