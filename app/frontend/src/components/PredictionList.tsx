import React from "react";

export interface Prediction {
  id: string;
  user_id: string;
  activity: string;
  accuracy: number;
  actual_activity?: string;
  timestamp: any; // Firestore Timestamp or Date
  time: Date;

  accelX?: number;
  accelY?: number;
  accelZ?: number;
  battery?: number;
}

interface PredictionListProps {
  predictions: Prediction[];
  isSimulated?: boolean;
}

type Activity =
  | "walking"
  | "running"
  | "jogging"
  | "sitting"
  | "standing"
  | "lying"
  | "upstairs"
  | "downstairs"
  | null;

// Normalize the activity string to Activity type or null
function normalizeActivity(input?: string | null): Activity {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (
    [
      "walking",
      "running",
      "jogging",
      "sitting",
      "standing",
      "lying",
      "upstairs",
      "downstairs",
    ].includes(lower)
  ) {
    return lower as Activity;
  }
  return null;
}

// Format activity label for display
function formatActivityLabel(activity: Activity): string {
  if (!activity) return "N/A";
  switch (activity) {
    case "upstairs":
      return "Upstairs";
    case "downstairs":
      return "Downstairs";
    default:
      return activity.charAt(0).toUpperCase() + activity.slice(1);
  }
}

const PredictionList: React.FC<PredictionListProps> = ({
  predictions,
  isSimulated,
}) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
      <ul className="space-y-3">
        {predictions.map((p) => {
          const normalizedActivity = normalizeActivity(p.activity);
          const normalizedActualActivity = normalizeActivity(p.actual_activity);
          return (
            <li
              key={p.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <p>
                <strong>User:</strong> {p.user_id}
              </p>
              <p>
                <strong>Predicted Activity:</strong>{" "}
                {formatActivityLabel(normalizedActivity)}
              </p>
              {isSimulated && normalizedActualActivity && (
                <p>
                  <strong>Actual Activity:</strong>{" "}
                  {formatActivityLabel(normalizedActualActivity)}
                </p>
              )}
              <p>
                <strong>Accuracy:</strong>{" "}
                {(p.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-sm italic text-muted-foreground">
                {p.time.toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PredictionList;
