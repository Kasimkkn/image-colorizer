import { Pencil, PenTool, Minus, Eraser, ZoomIn, Undo2, Redo2, Settings, MousePointer } from "lucide-react";
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
    {
      id: "pencil" as DrawingTool,
      icon: Pencil,
      label: "Freehand Drawing",
      description: "Draw freely",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-700"
    },
    {
      id: "pen" as DrawingTool,
      icon: PenTool,
      label: "Precision Pen",
      description: "Bezier curves",
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    },
    {
      id: "line" as DrawingTool,
      icon: Minus,
      label: "Line Tool",
      description: "Straight lines",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700"
    },
    {
      id: "eraser" as DrawingTool,
      icon: Eraser,
      label: "Eraser",
      description: "Remove segments",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700"
    },
    {
      id: "zoom" as DrawingTool,
      icon: ZoomIn,
      label: "Zoom Tool",
      description: "Navigate canvas",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700"
    },
  ];

  const activeTool_info = tools.find(tool => tool.id === activeTool);

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-indigo-500/10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
            <MousePointer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Drawing Tools</h3>
            <p className="text-sm text-slate-500">Professional toolkit</p>
          </div>
        </div>

        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold px-3 py-1">
          {Math.round(zoomLevel * 100)}%
        </Badge>
      </div>

      {/* Active Tool Display */}
      {activeTool_info && (
        <div className={`${activeTool_info.bgColor} border-2 ${activeTool_info.borderColor} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${activeTool_info.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <activeTool_info.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className={`font-semibold ${activeTool_info.textColor}`}>{activeTool_info.label}</div>
              <div className="text-sm text-slate-500">{activeTool_info.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tool Grid */}
      <div className="grid grid-cols-3 gap-3">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log(`Tool button clicked: ${tool.id}`);
              onToolChange(tool.id);
            }}
            className={`relative group transition-all duration-300 h-16 flex flex-col items-center justify-center ${activeTool === tool.id
                ? `bg-gradient-to-br ${tool.color} text-white shadow-lg hover:shadow-xl border-0 scale-105`
                : `bg-white/80 hover:${tool.bgColor} hover:${tool.borderColor} border-2 border-slate-200 hover:scale-105 hover:shadow-lg`
              }`}
            title={tool.label}
          >
            <tool.icon className={`h-5 w-5 ${activeTool === tool.id ? 'text-white' : 'text-slate-600'}`} />
            <span className={`text-xs font-medium mt-1 ${activeTool === tool.id ? 'text-white' : 'text-slate-600'}`}>
              {tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
            </span>

            {/* Active indicator */}
            {activeTool === tool.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
          </Button>
        ))}
      </div>

      <Separator className="bg-slate-200" />

      {/* Brush Size Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" />
            <label className="text-sm font-semibold text-slate-700">Brush Size</label>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded-lg border">
            <span className="text-sm font-mono text-slate-600">{brushSize}px</span>
          </div>
        </div>

        <div className="space-y-3">
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            min={2}
            max={20}
            step={1}
            className="w-full"
          />

          {/* Size Presets */}
          <div className="flex justify-between gap-2">
            {[3, 5, 8, 12, 16].map((size) => (
              <Button
                key={size}
                variant={brushSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => onBrushSizeChange(size)}
                className={`flex-1 text-xs font-medium rounded-lg transition-all duration-200 ${brushSize === size
                    ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg"
                    : "hover:bg-slate-50 hover:border-slate-300"
                  }`}
              >
                {size}px
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-slate-200" />

      {/* Tool-Specific Options */}
      {activeTool === "line" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <label className="text-sm font-semibold text-slate-700">Line Options</label>
          </div>
          <Button
            variant={snapToAngle ? "default" : "outline"}
            size="sm"
            onClick={() => onSnapToAngleChange(!snapToAngle)}
            className={`w-full text-sm font-medium rounded-xl transition-all duration-200 ${snapToAngle
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                : "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${snapToAngle ? 'bg-white' : 'bg-green-500'}`}></div>
              Angle Snap: {snapToAngle ? "ON" : "OFF"}
            </div>
          </Button>
        </div>
      )}

      <Separator className="bg-slate-200" />

      {/* History Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <label className="text-sm font-semibold text-slate-700">History</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Undo clicked");
              onUndo();
            }}
            disabled={!canUndo}
            className={`flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ${canUndo
                ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                : "opacity-40 cursor-not-allowed"
              }`}
            title="Undo last action"
          >
            <Undo2 className="h-4 w-4" />
            <span className="text-sm">Undo</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Redo clicked");
              onRedo();
            }}
            disabled={!canRedo}
            className={`flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ${canRedo
                ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                : "opacity-40 cursor-not-allowed"
              }`}
            title="Redo last action"
          >
            <Redo2 className="h-4 w-4" />
            <span className="text-sm">Redo</span>
          </Button>
        </div>
      </div>

      {/* Tool Tips */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="text-xs font-semibold text-slate-600 mb-2">💡 Quick Tips</div>
        <div className="text-xs text-slate-500 space-y-1">
          {activeTool === "pencil" && (
            <>
              <div>• Create a segment first before drawing</div>
              <div>• Adjust brush size for better control</div>
            </>
          )}
          {activeTool === "line" && (
            <>
              <div>• Click points to create straight lines</div>
              <div>• Enable angle snap for precision</div>
            </>
          )}
          {activeTool === "pen" && (
            <>
              <div>• Click to place control points</div>
              <div>• Close near start point to finish</div>
            </>
          )}
          {activeTool === "eraser" && (
            <>
              <div>• Click on segments to remove them</div>
              <div>• Use with precision for cleanup</div>
            </>
          )}
          {activeTool === "zoom" && (
            <>
              <div>• Click to zoom in/out</div>
              <div>• Current: {Math.round(zoomLevel * 100)}%</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};