"use client"; // If using Next.js 13+ app router, else omit

import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

import PredictionList from "./components/PredictionList";
import Header from "./components/dashboard/Header";
import StatusCard from "./components/dashboard/StatusCard";
import SensorData from "./components/dashboard/SensorData";
import ActivityPrediction from "./components/dashboard/ActivityPrediction";
import AccelerometerGraph from "./components/dashboard/AccelerometerGraph";
import ControlPanel from "./components/dashboard/ControlPanel";

import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";

import NotFound from "./pages/NotFound";

import { Switch } from "./components/ui/switch";
import isEqual from "lodash.isequal";

const queryClient = new QueryClient();

type Activity =
  | "walking"
  | "running"
  | "jogging"
  | "sitting"
  | "standing"
  | "lying"
  | "downstairs"
  | "upstairs";

import type { Prediction } from "./components/PredictionList";

const toActivity = (str?: string): Activity | null => {
  const activities = [
    "walking",
    "running",
    "jogging",
    "sitting",
    "standing",
    "lying",
    "downstairs",
    "upstairs",
  ] as const;
  if (str && activities.includes(str as Activity)) {
    return str as Activity;
  }
  return null;
};

const App = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelType, setModelType] = useState<"lstm" | "svm">("lstm");

  // Fetch initial model state from backend on mount
  useEffect(() => {
    fetch("http://localhost:5001/api/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.active_model === "svm" || data.active_model === "lstm") {
          setModelType(data.active_model);
        }
      })
      .catch((err) => console.error("Failed to get model:", err));
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    const sourceFilter = isSimulated ? "simulated" : "live";

    const q = query(
      collection(db, "predictions"),
      where("source", "==", sourceFilter),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    let debounceTimer: NodeJS.Timeout | null = null;
    let latestPreds: Prediction[] = [];

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const preds: Prediction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const sensor = data.sensor_data || {};

          let parsedTime: Date;
          if (data.timestamp?.toDate) parsedTime = data.timestamp.toDate();
          else if (typeof data.timestamp === "string")
            parsedTime = new Date(data.timestamp);
          else parsedTime = new Date();

          const rawActivity = data.activity
            ? String(data.activity).toLowerCase()
            : "unknown";
          const rawActualActivity = data.actual_activity
            ? String(data.actual_activity).toLowerCase()
            : undefined;

          preds.push({
            id: doc.id,
            user_id: data.user_id ?? "",
            activity: rawActivity,
            accuracy: data.accuracy ?? 0,
            actual_activity: rawActualActivity,
            timestamp: data.timestamp,
            accelX: sensor.x ?? 0,
            accelY: sensor.y ?? 0,
            accelZ: sensor.z ?? 0,
            battery: data.battery,
            time: parsedTime,
          });
        });

        latestPreds = preds;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setPredictions((oldPreds) => {
            if (isEqual(oldPreds, latestPreds)) {
              return oldPreds;
            }
            return latestPreds;
          });
          debounceTimer = null;
        }, 400);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
      }
    );

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isSimulated, isStreaming]);

  const latestPrediction = predictions[0];

  const resetData = () => setPredictions([]);

  const toggleStreaming = () => setIsStreaming((prev) => !prev);

  const handleModelSwitch = async (useSVM: boolean) => {
    const selectedModel = useSVM ? "svm" : "lstm";
    setModelType(selectedModel);

    try {
      const response = await fetch("http://localhost:5001/api/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model_type: selectedModel }),
      });

      if (!response.ok) {
        console.error("Failed to switch model");
      }
    } catch (error) {
      console.error("Error switching model:", error);
    }
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <div className="min-h-screen bg-background text-foreground p-4 space-y-4">
                    <Header />

                    {/* Simulator toggle, model toggle, and theme toggle */}
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4 px-4">
                      <label className="inline-flex items-center space-x-3 cursor-pointer">
                        <Switch
                          checked={isSimulated}
                          onCheckedChange={(checked) =>
                            setIsSimulated(checked as boolean)
                          }
                          aria-label="Toggle between live and simulated data"
                        />
                        <span className="text-sm font-medium">
                          {isSimulated
                            ? "Simulator Mode"
                            : "Live Sensor Mode"}
                        </span>
                      </label>

                      <label className="inline-flex items-center space-x-3 cursor-pointer">
                        <Switch
                          checked={modelType === "svm"}
                          onCheckedChange={(checked) =>
                            handleModelSwitch(checked as boolean)
                          }
                          aria-label="Toggle between LSTM and SVM model"
                        />
                        <span className="text-sm font-medium">
                          {modelType === "svm"
                            ? "SVM Model"
                            : "LSTM Model"}
                        </span>
                      </label>

                      <ThemeToggle />
                    </div>

                    {/* Status and Sensor Data cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StatusCard
                        isConnected={!isSimulated}
                        isSimulated={isSimulated}
                        batteryLevel={latestPrediction?.battery ?? 100}
                        userId={latestPrediction?.user_id ?? ""}
                      />
                      <SensorData
                        x={latestPrediction?.accelX ?? 0}
                        y={latestPrediction?.accelY ?? 0}
                        z={latestPrediction?.accelZ ?? 0}
                      />
                    </div>

                    {/* Graph on left, ActivityPrediction + ControlPanel stacked on right */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <AccelerometerGraph
                          data={predictions.map((p) => ({
                            x: p.accelX,
                            y: p.accelY,
                            z: p.accelZ,
                            time: p.time.toISOString(),
                          }))}
                        />
                      </div>

                      <div className="flex flex-col space-y-4 w-full">
                        <ActivityPrediction
                          activity={
                            toActivity(latestPrediction?.activity) ?? null
                          }
                          accuracy={(latestPrediction?.accuracy ?? 0) * 100}
                          actualActivity={
                            isSimulated
                              ? toActivity(
                                  latestPrediction?.actual_activity
                                ) ?? null
                              : undefined
                          }
                          isSimulated={isSimulated}
                        />
                        <ControlPanel
                          isStreaming={isStreaming}
                          onToggleStreaming={toggleStreaming}
                          onReset={resetData}
                        />
                      </div>
                    </div>

                    {/* Prediction List */}
                    <div className="mt-4 px-4">
                      <PredictionList
                        predictions={predictions}
                        isSimulated={isSimulated}
                      />
                    </div>
                  </div>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
