import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Settings } from "lucide-react";

type ControlPanelProps = {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onReset: () => void;
};

const ControlPanel = ({ isStreaming, onToggleStreaming, onReset }: ControlPanelProps) => {
  return (
    <Card className="shadow-md rounded-xl bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[hsl(var(--card-foreground))]">
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Button 
            onClick={onToggleStreaming}
            className={`w-full font-medium shadow-md text-white ${
              isStreaming 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Stop Streaming
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start Streaming
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onReset}
            className="
              w-full 
              border border-purple-500 
              text-purple-600 
              hover:bg-purple-100 
              hover:border-purple-600 
              transition
              dark:hover:bg-purple-900
              dark:text-purple-400
              dark:border-purple-600
              dark:hover:border-purple-400
            "
          >
            <Settings className="mr-2 h-4 w-4" /> Reset Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
