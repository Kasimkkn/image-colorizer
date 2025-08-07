import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Path } from "fabric";
import { Toolbar, Tool } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasEditorProps {
  imageFile: File;
  onBack: () => void;
}

export const CanvasEditor = ({ imageFile, onBack }: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#ff6b6b");
  const [opacity, setOpacity] = useState(0.8);
  const [zoom, setZoom] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current) return;

    // Create canvas
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#1a1a1a",
    });

    // Load image
    const imageUrl = URL.createObjectURL(imageFile);
    const img = new Image();
    
    img.onload = () => {
      FabricImage.fromURL(imageUrl).then((fabricImg) => {
        // Scale image to fit canvas
        const scaleX = (canvas.width! - 40) / img.width;
        const scaleY = (canvas.height! - 40) / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        fabricImg.scale(scale);
        fabricImg.set({
          left: (canvas.width! - fabricImg.getScaledWidth()) / 2,
          top: (canvas.height! - fabricImg.getScaledHeight()) / 2,
          selectable: false,
          evented: false
        });
        
        canvas.add(fabricImg);
        canvas.sendObjectToBack(fabricImg);
        canvas.renderAll();
        
        // Save initial state
        saveState(canvas);
        toast.success("Image loaded successfully!");
      });
      
      URL.revokeObjectURL(imageUrl);
    };
    
    img.src = imageUrl;

    // Setup drawing brush
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 5;
    canvas.isDrawingMode = activeTool === "brush";

    // Canvas event listeners
    canvas.on('path:created', () => {
      saveState(canvas);
    });

    canvas.on('object:added', () => {
      setCanUndo(true);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageFile, color]);

  const saveState = (canvas: FabricCanvas) => {
    const state = canvas.toJSON();
    setHistory(prev => [...prev.slice(-19), JSON.stringify(state)]);
    setCanUndo(true);
  };

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "brush" || activeTool === "eraser";
    
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === "eraser" ? "#1a1a1a" : color;
      fabricCanvas.freeDrawingBrush.width = activeTool === "eraser" ? 10 : 5;
    }
  }, [activeTool, color, fabricCanvas]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2;
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
    
    fabricCanvas.setZoom(clampedZoom);
    setZoom(clampedZoom);
  };

  const handleUndo = () => {
    if (!fabricCanvas || history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
      setCanUndo(history.length > 1);
    });
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.getObjects().forEach(obj => {
      if (obj.type !== 'image') {
        fabricCanvas.remove(obj);
      }
    });
    
    fabricCanvas.renderAll();
    saveState(fabricCanvas);
    toast.success("Canvas cleared!");
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = 'colorized-image.png';
    link.href = dataURL;
    link.click();
    
    toast.success("Image downloaded!");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-text">Image Colorization Studio</h1>
            <p className="text-muted-foreground">Transform your images with professional colorization tools</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Back to Upload
          </Button>
        </div>

        {/* Tools Panel */}
        <div className="flex gap-6 flex-wrap">
          <Toolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClear={handleClear}
            onDownload={handleDownload}
            canUndo={canUndo}
            onUndo={handleUndo}
          />

          <ColorPicker
            color={color}
            onChange={setColor}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />

          {/* Zoom Controls */}
          <div className="glass-panel p-4 rounded-xl shadow-card">
            <div className="flex items-center gap-2">
              <Button
                variant="tool"
                size="icon"
                onClick={() => handleZoom('out')}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono px-2 min-w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="tool"
                size="icon"
                onClick={() => handleZoom('in')}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="glass-panel p-6 rounded-xl shadow-card">
            <canvas
              ref={canvasRef}
              className="border border-border rounded-lg shadow-neon-strong"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-panel p-4 rounded-xl shadow-card max-w-2xl mx-auto">
          <h3 className="font-semibold neon-text mb-2">Quick Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use the <strong>Brush</strong> tool to add colors to specific areas</li>
            <li>• Use the <strong>Eraser</strong> to remove unwanted strokes</li>
            <li>• Adjust opacity for subtle color blending effects</li>
            <li>• Zoom in for detailed work on small areas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};