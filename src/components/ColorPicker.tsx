import { useState } from "react";
import { Palette, Droplet } from "lucide-react";
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

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="glass-panel p-4 rounded-xl shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-border shadow-neon cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: color }}
            onClick={() => document.getElementById('color-input')?.click()}
          >
            <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          
          <div className="flex-1">
            <Label className="text-sm font-medium neon-text">Color</Label>
            <div className="text-xs text-muted-foreground font-mono">{color}</div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="tool" size="icon" className="shadow-neon">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 glass-panel border-border">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Preset Colors</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {presetColors.map((presetColor) => (
                      <button
                        key={presetColor}
                        className={`w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110 ${
                          color === presetColor ? 'border-primary shadow-neon' : 'border-border'
                        }`}
                        style={{ backgroundColor: presetColor }}
                        onClick={() => onChange(presetColor)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Custom Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      id="color-input"
                      type="color"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      className="w-full h-10 rounded border border-border cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Opacity</Label>
            <span className="text-xs text-muted-foreground ml-auto">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(value) => onOpacityChange(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};