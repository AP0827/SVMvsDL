import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SensorDataProps = {
  x: number;
  y: number;
  z: number;
};

const SensorData = ({ x, y, z }: SensorDataProps) => {
  return (
    <Card className="shadow-md rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Accelerometer Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div
            className="flex flex-col items-center justify-center p-4 rounded-lg
                       bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
          >
            <span className="text-xs mb-1 opacity-80">X-axis</span>
            <span className="text-2xl font-semibold">{x.toFixed(2)}</span>
          </div>
          <div
            className="flex flex-col items-center justify-center p-4 rounded-lg
                       bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
          >
            <span className="text-xs mb-1 opacity-80">Y-axis</span>
            <span className="text-2xl font-semibold">{y.toFixed(2)}</span>
          </div>
          <div
            className="flex flex-col items-center justify-center p-4 rounded-lg
                       bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
          >
            <span className="text-xs mb-1 opacity-80">Z-axis</span>
            <span className="text-2xl font-semibold">{z.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensorData;
