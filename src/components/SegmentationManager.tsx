
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Trash2, Plus, Palette } from "lucide-react";
import { toast } from "sonner";

export interface Segment {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  closed: boolean;
  points: Array<{x: number, y: number}>;
}

interface SegmentationManagerProps {
  segments: Segment[];
  activeSegmentId: string | null;
  onSegmentSelect: (id: string) => void;
  onSegmentCreate: () => void;
  onSegmentDelete: (id: string) => void;
  onSegmentToggleVisibility: (id: string) => void;
  onSegmentColorChange: (id: string, color: string) => void;
}

const SEGMENT_COLORS = [
  "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", 
  "#f0932b", "#eb4d4b", "#6c5ce7", "#a29bfe",
  "#fd79a8", "#00b894", "#0984e3", "#e84393"
];

export const SegmentationManager = ({
  segments,
  activeSegmentId,
  onSegmentSelect,
  onSegmentCreate,
  onSegmentDelete,
  onSegmentToggleVisibility,
  onSegmentColorChange
}: SegmentationManagerProps) => {
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  const handleCreateSegment = () => {
    onSegmentCreate();
    toast.success("New segment created!");
  };

  const handleDeleteSegment = (id: string) => {
    onSegmentDelete(id);
    toast.success("Segment deleted!");
  };

  return (
    <div className="glass-panel p-4 rounded-xl shadow-card space-y-4 min-w-64">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold neon-text">Segments</h3>
        <Button
          variant="neon"
          size="sm"
          onClick={handleCreateSegment}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {segments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No segments created yet. Click "New" to start segmenting.
          </p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                activeSegmentId === segment.id
                  ? "border-primary shadow-neon bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSegmentSelect(segment.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm font-medium">{segment.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentToggleVisibility(segment.id);
                    }}
                  >
                    {segment.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 opacity-50" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSegment(segment.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{segment.points.length} points</span>
                <Badge variant={segment.closed ? "default" : "secondary"} className="text-xs">
                  {segment.closed ? "Closed" : "Open"}
                </Badge>
              </div>

              {/* Color Picker */}
              {colorPickerOpen === segment.id && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="grid grid-cols-6 gap-1">
                    {SEGMENT_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border-2 border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSegmentColorChange(segment.id, color);
                          setColorPickerOpen(null);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setColorPickerOpen(colorPickerOpen === segment.id ? null : segment.id);
                }}
              >
                <Palette className="h-3 w-3 mr-1" />
                Change Color
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
