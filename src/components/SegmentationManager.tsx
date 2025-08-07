import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Palette, Plus, Trash2, Layers, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Segment {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  closed: boolean;
  points: Array<{ x: number, y: number }>;
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
    console.log("Create segment clicked");
    onSegmentCreate();
    toast.success("New segment created!");
  };

  const handleDeleteSegment = (id: string) => {
    console.log(`Delete segment clicked: ${id}`);
    onSegmentDelete(id);
    toast.success("Segment deleted!");
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-indigo-500/10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Segments</h3>
            <p className="text-sm text-slate-500">Manage drawing layers</p>
          </div>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleCreateSegment}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/25 border-0 transition-all duration-200 hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {/* Segments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {segments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium mb-2">No segments created</p>
            <p className="text-sm text-slate-400">Click "New Segment" to start outlining areas</p>
          </div>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${activeSegmentId === segment.id
                  ? "border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                  : "border-slate-200 bg-white/60 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-md"
                }`}
              onClick={() => {
                console.log(`Segment selected: ${segment.id}`);
                onSegmentSelect(segment.id);
              }}
            >
              {/* Active indicator */}
              {activeSegmentId === segment.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-lg border-2 border-white shadow-lg"
                      style={{ backgroundColor: segment.color }}
                    />
                    {activeSegmentId === segment.id && (
                      <div className="absolute -inset-1 border-2 border-indigo-500 rounded-lg animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">{segment.name}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {segment.points.length} points
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 ${segment.visible
                        ? "text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                        : "text-slate-400 hover:bg-slate-100"
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Toggle visibility: ${segment.id}`);
                      onSegmentToggleVisibility(segment.id);
                    }}
                  >
                    {segment.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSegment(segment.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={segment.closed ? "default" : "secondary"}
                    className={`text-xs font-medium px-2 py-1 rounded-lg ${segment.closed
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                  >
                    {segment.closed ? "Closed" : "Open"}
                  </Badge>

                  {segment.visible && (
                    <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border-blue-200">
                      Visible
                    </Badge>
                  )}
                </div>
              </div>

              {/* Color Picker */}
              {colorPickerOpen === segment.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-6 gap-2">
                    {SEGMENT_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-all duration-200 hover:shadow-lg"
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`Color changed: ${segment.id} -> ${color}`);
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
                className="w-full mt-3 text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setColorPickerOpen(colorPickerOpen === segment.id ? null : segment.id);
                }}
              >
                <Palette className="h-4 w-4 mr-2" />
                {colorPickerOpen === segment.id ? "Close Colors" : "Change Color"}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {segments.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-lg font-bold text-slate-800">{segments.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-lg font-bold text-emerald-700">{segments.filter(s => s.closed).length}</div>
              <div className="text-xs text-emerald-600 font-medium">Closed</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-lg font-bold text-blue-700">{segments.filter(s => s.visible).length}</div>
              <div className="text-xs text-blue-600 font-medium">Visible</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};