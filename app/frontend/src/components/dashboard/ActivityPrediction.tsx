import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

interface ActivityPredictionProps {
  activity: string | null | undefined;
  accuracy: number;
  actualActivity?: string | null | undefined;
  isSimulated?: boolean;
}

function normalizeActivity(input: string | null | undefined): Activity {
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

const ActivityPrediction: React.FC<ActivityPredictionProps> = ({
  activity,
  accuracy,
  actualActivity,
  isSimulated = false,
}) => {
  const normalizedActivity = normalizeActivity(activity);
  const normalizedActual = normalizeActivity(actualActivity);

  return (
    <Card className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border shadow-md rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[hsl(var(--card-foreground))]">
          Activity Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSimulated ? (
          <>
            <div className="text-base mb-2">
              <span role="img" aria-label="Actual Activity" className="mr-2">
                🎯
              </span>
              <strong>Actual Activity:</strong>{" "}
              <span className="font-medium text-[hsl(var(--card-foreground))]">
                {formatActivityLabel(normalizedActual)}
              </span>
            </div>
            <div className="text-base">
              <span role="img" aria-label="Predicted Activity" className="mr-2">
                🔮
              </span>
              <strong>Predicted Activity:</strong>{" "}
              <span className="font-medium text-[hsl(var(--card-foreground))]">
                {formatActivityLabel(normalizedActivity)}
              </span>{" "}
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                ({accuracy.toFixed(1)}%)
              </span>
            </div>
          </>
        ) : (
          <div className="text-base">
            <span role="img" aria-label="Predicted Activity" className="mr-2">
              🔮
            </span>
            <strong>Predicted Activity:</strong>{" "}
            <span className="font-medium text-[hsl(var(--card-foreground))]">
              {formatActivityLabel(normalizedActivity)}
            </span>{" "}
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              ({accuracy.toFixed(1)}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityPrediction;
