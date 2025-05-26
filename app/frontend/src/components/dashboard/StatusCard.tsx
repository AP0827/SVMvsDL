import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";

type StatusCardProps = {
  isConnected: boolean;
  batteryLevel?: number;
  isSimulated?: boolean;
  userId?: string;
};

const StatusCard = ({
  isConnected,
  batteryLevel = 100,
  isSimulated = false,
  userId,
}: StatusCardProps) => {
  return (
    <Card className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-md rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            {isSimulated ? (
              <>
                <Wifi className="h-6 w-6 text-[hsl(var(--accent))]" />
                <span className="font-medium text-[hsl(var(--accent))]">
                  Simulated Data
                </span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="h-6 w-6 text-green-500" />
                <span className="font-medium text-green-500">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-6 w-6 text-red-500" />
                <span className="font-medium text-red-500">
                  Disconnected
                </span>
              </>
            )}
          </div>

          {userId && (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              <strong>User ID:</strong> {userId}
            </div>
          )}

          {!isSimulated && batteryLevel != null && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Battery:</span>
              <div className="w-20 h-2 bg-[hsl(var(--input))] rounded-full overflow-hidden">
                <div
                  className={`h-2 ${
                    batteryLevel > 20
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {batteryLevel.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
