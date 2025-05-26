import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type DataPoint = {
  time: string;
  x: number;
  y: number;
  z: number;
};

type AccelerometerGraphProps = {
  data: DataPoint[];
};

const AccelerometerGraph = ({ data }: AccelerometerGraphProps) => {
  return (
    <Card
      className="
        bg-[hsl(var(--card))] 
        text-[hsl(var(--card-foreground))] 
        shadow-sm transition-all duration-200 hover:shadow-md 
        h-[350px]"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[hsl(var(--card-foreground))]">
          Accelerometer Time Series
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: 'hsl(var(--card-foreground))' }}
              minTickGap={30}
            />
            <YAxis
              domain={[-20, 20]}
              tick={{ fill: 'hsl(var(--card-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderRadius: 8,
                border: `1px solid hsl(var(--border))`,
                color: 'hsl(var(--card-foreground))'
              }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--card-foreground))' }} />
            <Line
              type="monotone"
              dataKey="x"
              stroke="var(--tech-primary)"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="var(--tech-secondary)"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke="var(--tech-accent)"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AccelerometerGraph;
