import { Brush, Eraser, MousePointer, Palette, RotateCcw, Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type Tool = "select" | "brush" | "eraser" | "bucket";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClear: () => void;
  onDownload: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export const Toolbar = ({
  activeTool,
  onToolChange,
  onClear,
  onDownload,
  canUndo,
  onUndo
}: ToolbarProps) => {
  const tools = [
    { id: "select" as Tool, icon: MousePointer, label: "Select", color: "tool-select" },
    { id: "brush" as Tool, icon: Brush, label: "Brush", color: "tool-brush" },
    { id: "eraser" as Tool, icon: Eraser, label: "Eraser", color: "tool-eraser" },
    { id: "bucket" as Tool, icon: Palette, label: "Fill", color: "tool-bucket" },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl shadow-card">
      <div className="flex items-center gap-2">
        {/* Drawing Tools */}
        <div className="flex gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "tool-active" : "tool"}
              size="tool"
              onClick={() => onToolChange(tool.id)}
              className={`relative group ${
                activeTool === tool.id 
                  ? `shadow-[0_0_20px_hsl(var(--${tool.color})/0.5)]` 
                  : `hover:shadow-[0_0_15px_hsl(var(--${tool.color})/0.3)]`
              }`}
              title={tool.label}
            >
              <tool.icon className="h-5 w-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-popover px-2 py-1 rounded border whitespace-nowrap">
                {tool.label}
              </span>
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8 mx-2" />

        {/* Action Tools */}
        <div className="flex gap-1">
          <Button
            variant="tool"
            size="tool"
            onClick={onUndo}
            disabled={!canUndo}
            className="hover:shadow-[0_0_15px_hsl(45_100%_60%/0.3)]"
            title="Undo"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            variant="tool"
            size="tool"
            onClick={onClear}
            className="hover:shadow-[0_0_15px_hsl(0_84%_60%/0.3)]"
            title="Clear Canvas"
          >
            <Layers className="h-5 w-5" />
          </Button>

          <Button
            variant="neon"
            size="tool"
            onClick={onDownload}
            className="ml-2"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};