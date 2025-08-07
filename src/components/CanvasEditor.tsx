
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Path, Circle, Line } from "fabric";
import { DrawingTools, DrawingTool } from "./DrawingTools";
import { SegmentationManager, Segment } from "./SegmentationManager";
import { ColorPicker } from "./ColorPicker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BezierCurve, snapToAngle, isPointNearPoint, Point } from "@/utils/bezierUtils";

interface CanvasEditorProps {
  imageFile: File;
  onBack: () => void;
}

export const CanvasEditor = ({ imageFile, onBack }: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("pencil");
  const [color, setColor] = useState("#ff6b6b");
  const [opacity, setOpacity] = useState(0.8);
  const [zoom, setZoom] = useState(1);
  
  // Drawing tools state
  const [brushSize, setBrushSize] = useState(5);
  const [snapAngles, setSnapAngles] = useState(false);
  const [bezierCurve] = useState(new BezierCurve());
  
  // History state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Segmentation state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [tempPathObjects, setTempPathObjects] = useState<any[]>([]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveState = useCallback((canvas: FabricCanvas) => {
    const state = canvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(state));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const createPathFromPoints = (points: Point[], strokeColor: string) => {
    if (points.length < 2) return null;
    
    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return new Path(pathString, {
      stroke: strokeColor,
      strokeWidth: 2,
      fill: '',
      selectable: false,
      evented: false,
      opacity: 0.8
    });
  };

  const updatePathVisualization = useCallback(() => {
    if (!fabricCanvas || !currentPath.length) return;
    
    // Remove previous temp path objects
    tempPathObjects.forEach(obj => fabricCanvas.remove(obj));
    setTempPathObjects([]);
    
    const newTempObjects = [];
    
    // Draw lines between points
    for (let i = 0; i < currentPath.length - 1; i++) {
      const line = new Line([
        currentPath[i].x, currentPath[i].y,
        currentPath[i + 1].x, currentPath[i + 1].y
      ], {
        stroke: color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.7
      });
      fabricCanvas.add(line);
      newTempObjects.push(line);
    }
    
    // Draw points
    currentPath.forEach((point, index) => {
      const circle = new Circle({
        left: point.x - 3,
        top: point.y - 3,
        radius: 3,
        fill: color,
        selectable: false,
        evented: false,
        opacity: 0.8
      });
      fabricCanvas.add(circle);
      newTempObjects.push(circle);
    });
    
    setTempPathObjects(newTempObjects);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentPath, color, tempPathObjects]);

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
    canvas.freeDrawingBrush.width = brushSize;
    canvas.isDrawingMode = activeTool === "pencil";

    // Canvas event listeners
    canvas.on('path:created', () => {
      saveState(canvas);
    });

    canvas.on('object:added', () => {
      // Object added, history will be saved by saveState
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageFile, color, brushSize, activeTool, saveState]);

  const handleUndo = () => {
    if (!fabricCanvas || !canUndo) return;
    
    const previousState = history[historyIndex - 1];
    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(historyIndex - 1);
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || !canRedo) return;
    
    const nextState = history[historyIndex + 1];
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(historyIndex + 1);
    });
  };

  const handleToolChange = (tool: DrawingTool) => {
    if (!fabricCanvas) return;
    
    setActiveTool(tool);
    
    // Clear any ongoing path
    if (tempPathObjects.length > 0) {
      tempPathObjects.forEach(obj => fabricCanvas.remove(obj));
      setTempPathObjects([]);
      fabricCanvas.renderAll();
    }
    
    setCurrentPath([]);
    setIsDrawingPath(false);
    bezierCurve.clear();
    
    // Set drawing mode based on tool
    if (tool === "pencil") {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = color;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    } else if (tool === "eraser") {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = "#1a1a1a";
      fabricCanvas.freeDrawingBrush.width = 10;
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  };

  const handleCanvasClick = useCallback((e: any) => {
    if (!fabricCanvas || activeTool === "pencil" || activeTool === "eraser") return;
    
    const pointer = fabricCanvas.getPointer(e.e);
    const point = { x: pointer.x, y: pointer.y };
    
    if (activeTool === "line" || activeTool === "pen") {
      if (!activeSegmentId) {
        toast.error("Please create a segment first!");
        return;
      }
      
      if (!isDrawingPath) {
        // Start new path
        setCurrentPath([point]);
        setIsDrawingPath(true);
      } else {
        let finalPoint = point;
        
        // Apply angle snapping for line tool
        if (activeTool === "line" && snapAngles && currentPath.length > 0) {
          finalPoint = snapToAngle(point, currentPath[currentPath.length - 1]);
        }
        
        const newPath = [...currentPath, finalPoint];
        setCurrentPath(newPath);
        
        // Check for auto-close (within 10px of start point)
        if (newPath.length > 2 && isPointNearPoint(finalPoint, newPath[0])) {
          // Close the path and create segment
          finalizePath([...newPath, newPath[0]], true);
        }
      }
    } else if (activeTool === "zoom") {
      // Handle zoom functionality
      const newZoom = zoom < 3 ? zoom * 1.2 : 1;
      fabricCanvas.setZoom(newZoom);
      setZoom(newZoom);
    }
  }, [fabricCanvas, activeTool, currentPath, isDrawingPath, snapAngles, activeSegmentId, zoom]);

  const finalizePath = (pathPoints: Point[], closed: boolean) => {
    if (!activeSegmentId || !fabricCanvas) return;
    
    // Remove temp objects
    tempPathObjects.forEach(obj => fabricCanvas.remove(obj));
    setTempPathObjects([]);
    
    // Create final path object
    const pathObj = createPathFromPoints(pathPoints, color);
    if (pathObj) {
      fabricCanvas.add(pathObj);
    }
    
    // Update segment
    setSegments(prev => prev.map(segment => 
      segment.id === activeSegmentId
        ? { ...segment, points: pathPoints, closed }
        : segment
    ));
    
    setCurrentPath([]);
    setIsDrawingPath(false);
    saveState(fabricCanvas);
    
    toast.success(closed ? "Segment closed!" : "Segment path added!");
  };

  const handleSegmentCreate = () => {
    const newSegment: Segment = {
      id: `segment-${Date.now()}`,
      name: `Segment ${segments.length + 1}`,
      color: color,
      visible: true,
      closed: false,
      points: []
    };
    
    setSegments(prev => [...prev, newSegment]);
    setActiveSegmentId(newSegment.id);
    toast.success("New segment created! Start drawing to outline the area.");
  };

  const handleSegmentDelete = (id: string) => {
    setSegments(prev => prev.filter(seg => seg.id !== id));
    if (activeSegmentId === id) {
      setActiveSegmentId(null);
    }
  };

  const handleSegmentToggleVisibility = (id: string) => {
    setSegments(prev => prev.map(segment =>
      segment.id === id ? { ...segment, visible: !segment.visible } : segment
    ));
  };

  const handleSegmentColorChange = (id: string, newColor: string) => {
    setSegments(prev => prev.map(segment =>
      segment.id === id ? { ...segment, color: newColor } : segment
    ));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2;
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
    
    fabricCanvas.setZoom(clampedZoom);
    setZoom(clampedZoom);
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

  // Update path visualization when currentPath changes
  useEffect(() => {
    updatePathVisualization();
  }, [updatePathVisualization]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.on('mouse:down', handleCanvasClick);
    
    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
    };
  }, [fabricCanvas, handleCanvasClick]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-text">Image Colorization Studio</h1>
            <p className="text-muted-foreground">Professional segmentation and colorization tools</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Back to Upload
          </Button>
        </div>

        {/* Tools Panel */}
        <div className="flex gap-6 flex-wrap">
          <DrawingTools
            activeTool={activeTool}
            onToolChange={handleToolChange}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            zoomLevel={zoom}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            snapToAngle={snapAngles}
            onSnapToAngleChange={setSnapAngles}
          />

          <SegmentationManager
            segments={segments}
            activeSegmentId={activeSegmentId}
            onSegmentSelect={setActiveSegmentId}
            onSegmentCreate={handleSegmentCreate}
            onSegmentDelete={handleSegmentDelete}
            onSegmentToggleVisibility={handleSegmentToggleVisibility}
            onSegmentColorChange={handleSegmentColorChange}
          />

          <ColorPicker
            color={color}
            onChange={setColor}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="glass-panel p-6 rounded-xl shadow-card">
            <canvas
              ref={canvasRef}
              className="border border-border rounded-lg shadow-neon-strong cursor-crosshair"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-panel p-4 rounded-xl shadow-card max-w-4xl mx-auto">
          <h3 className="font-semibold neon-text mb-2">Phase 2: Manual Segmentation Guide</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">Drawing Tools:</h4>
              <ul className="space-y-1">
                <li>• <strong>Pencil:</strong> Free-hand drawing (2-20px brush)</li>
                <li>• <strong>Pen:</strong> Bezier curves for precise edges</li>
                <li>• <strong>Line:</strong> Straight lines with snap-to-angle</li>
                <li>• <strong>Eraser:</strong> Remove outline segments</li>
                <li>• <strong>Zoom:</strong> Up to 300% magnification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Segmentation:</h4>
              <ul className="space-y-1">
                <li>• Create segments to outline different image regions</li>
                <li>• Draw closed polygons around image parts</li>
                <li>• Auto-close shapes within 10px tolerance</li>
                <li>• Color-code segments for organization</li>
                <li>• Undo/Redo up to 20 steps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
