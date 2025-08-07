import { useState } from "react";
import { Palette, Droplet, Pipette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

export const ColorPicker = ({ color, onChange, opacity, onOpacityChange }: ColorPickerProps) => {
  const [customColor, setCustomColor] = useState(color);

  const presetColors = [
    "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57",
    "#ff9ff3", "#54a0ff", "#5f27cd", "#00d2d3", "#ff9f43",
    "#ffffff", "#f1f2f6", "#c4c4c4", "#8e8e8e", "#333333",
    "#000000"
  ];

  const professionalPalette = [
    "#1e293b", "#475569", "#64748b", "#94a3b8", "#cbd5e1",
    "#e2e8f0", "#f1f5f9", "#ffffff", "#fef3c7", "#fbbf24",
    "#f59e0b", "#d97706", "#92400e", "#451a03"
  ];

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    console.log(`Color changed to: ${newColor}`);
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-indigo-500/10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Color Picker</h3>
          <p className="text-sm text-slate-500">Professional color tools</p>
        </div>
      </div>

      {/* Current Color Display */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div
              className="w-16 h-16 rounded-2xl border-4 border-white shadow-2xl cursor-pointer relative overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: color }}
              onClick={() => document.getElementById('color-input')?.click()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
              <div className="absolute inset-0 ring-2 ring-white/20 rounded-xl" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-slate-200 flex items-center justify-center">
              <Pipette className="w-3 h-3 text-slate-600" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <Label className="text-sm font-semibold text-slate-700">Selected Color</Label>
              <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-lg mt-1 border">
                {color.toUpperCase()}
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300 text-slate-700 font-medium transition-all duration-200 rounded-xl"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Color Palette
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white/95 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-2xl p-6">
                <div className="space-y-6">
                  {/* Preset Colors */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Quick Colors</Label>
                    <div className="grid grid-cols-8 gap-2">
                      {presetColors.map((presetColor) => (
                        <button
                          key={presetColor}
                          className={`w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl ${color === presetColor
                              ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110'
                              : 'border-white hover:border-slate-300'
                            }`}
                          style={{ backgroundColor: presetColor }}
                          onClick={() => {
                            console.log(`Preset color selected: ${presetColor}`);
                            onChange(presetColor);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Professional Palette */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Professional Palette</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {professionalPalette.map((profColor) => (
                        <button
                          key={profColor}
                          className={`w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl ${color === profColor
                              ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110'
                              : 'border-white hover:border-slate-300'
                            }`}
                          style={{ backgroundColor: profColor }}
                          onClick={() => {
                            console.log(`Professional color selected: ${profColor}`);
                            onChange(profColor);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom Color */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-3 block">Custom Color</Label>
                    <div className="relative">
                      <input
                        id="color-input"
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className="w-full h-12 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-purple-300 transition-colors shadow-lg bg-white"
                      />
                      <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Opacity Control */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <Droplet className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700">Opacity</Label>
            <div className="bg-slate-100 px-3 py-1 rounded-lg border">
              <span className="text-sm font-mono text-slate-600">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Slider
            value={[opacity]}
            onValueChange={(value) => {
              console.log(`Opacity changed to: ${value[0]}`);
              onOpacityChange(value[0]);
            }}
            max={1}
            min={0}
            step={0.05}
            className="w-full"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-transparent rounded-lg"
              style={{
                backgroundColor: color,
                width: `${opacity * 100}%`,
                opacity: 0.2
              }}
            />
          </div>
        </div>

        {/* Opacity Presets */}
        <div className="flex justify-between gap-2">
          {[0.25, 0.5, 0.75, 1].map((preset) => (
            <Button
              key={preset}
              variant={Math.abs(opacity - preset) < 0.01 ? "default" : "outline"}
              size="sm"
              onClick={() => onOpacityChange(preset)}
              className={`flex-1 text-xs font-medium rounded-lg transition-all duration-200 ${Math.abs(opacity - preset) < 0.01
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "hover:bg-blue-50 hover:border-blue-300"
                }`}
            >
              {Math.round(preset * 100)}%
            </Button>
          ))}
        </div>
      </div>

      {/* Color Info */}
      <div className="pt-4 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-500 font-medium mb-1">RGB</div>
            <div className="text-sm font-mono text-slate-700">
              {color.length === 7 ? (
                `${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}`
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-500 font-medium mb-1">Alpha</div>
            <div className="text-sm font-mono text-slate-700">
              {(opacity * 255).toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};