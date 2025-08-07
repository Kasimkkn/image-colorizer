
import { Pencil, PenTool, Minus, Eraser, ZoomIn, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export type DrawingTool = "pencil" | "pen" | "line" | "eraser" | "zoom";

interface DrawingToolsProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  zoomLevel: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapToAngle: boolean;
  onSnapToAngleChange: (snap: boolean) => void;
}

export const DrawingTools = ({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  zoomLevel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapToAngle,
  onSnapToAngleChange
}: DrawingToolsProps) => {
  const tools = [
    { id: "pencil" as DrawingTool, icon: Pencil, label: "Pencil (Free-hand)", color: "tool-brush" },
    { id: "pen" as DrawingTool, icon: PenTool, label: "Pen (Bezier curves)", color: "tool-select" },
    { id: "line" as DrawingTool, icon: Minus, label: "Line Tool", color: "primary" },
    { id: "eraser" as DrawingTool, icon: Eraser, label: "Eraser", color: "tool-eraser" },
    { id: "zoom" as DrawingTool, icon: ZoomIn, label: "Zoom Tool", color: "accent" },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold neon-text">Drawing Tools</h3>
        <Badge variant="secondary" className="text-xs">
          Zoom: {Math.round(zoomLevel * 100)}%
        </Badge>
      </div>

      {/* Drawing Tools */}
      <div className="grid grid-cols-3 gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "tool-active" : "tool"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            className={`relative group ${
              activeTool === tool.id 
                ? `shadow-[0_0_15px_hsl(var(--${tool.color})/0.4)]` 
                : `hover:shadow-[0_0_10px_hsl(var(--${tool.color})/0.2)]`
            }`}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Separator />

      {/* Brush Size Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Brush Size</label>
          <span className="text-xs text-muted-foreground">{brushSize}px</span>
        </div>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          min={2}
          max={20}
          step={1}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Tool Options */}
      {activeTool === "line" && (
        <div className="space-y-2">
          <Button
            variant={snapToAngle ? "tool-active" : "tool"}
            size="sm"
            onClick={() => onSnapToAngleChange(!snapToAngle)}
            className="w-full text-xs"
          >
            Snap to Angle: {snapToAngle ? "ON" : "OFF"}
          </Button>
        </div>
      )}

      <Separator />

      {/* History Controls */}
      <div className="flex gap-2">
        <Button
          variant="tool"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="tool"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
