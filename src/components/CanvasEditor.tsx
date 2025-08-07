import { Button } from "@/components/ui/button";
import { Point } from "@/utils/bezierUtils";
import { Circle, Canvas as FabricCanvas, FabricImage, Path } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "./ColorPicker";
import { DrawingTool, DrawingTools } from "./DrawingTools";
import { Segment, SegmentationManager } from "./SegmentationManager";

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

  // History state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Segmentation state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [tempObjects, setTempObjects] = useState<any[]>([]);

  // Base image reference
  const [baseImage, setBaseImage] = useState<FabricImage | null>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveState = useCallback((canvas: FabricCanvas) => {
    const state = canvas.toJSON(['segmentId', 'isSegmentPath', 'originalColor']);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(state));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Create path from points for outline visualization
  const createPathFromPoints = useCallback((points: Point[], strokeColor: string, segmentId?: string) => {
    if (points.length < 2) return null;

    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }

    const path = new Path(pathString, {
      stroke: strokeColor,
      strokeWidth: 3,
      fill: '',
      selectable: false,
      evented: false,
      opacity: 0.8,
      strokeDashArray: [5, 5],
      // Custom properties for segment identification
      segmentId: segmentId,
      isSegmentPath: true
    });

    return path;
  }, []);

  // Create filled region for color application
  const createFilledRegion = useCallback((points: Point[], fillColor: string, segmentId: string) => {
    if (points.length < 3) return null;

    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }
    pathString += ' Z'; // Close the path

    const filledPath = new Path(pathString, {
      fill: fillColor,
      stroke: '',
      strokeWidth: 0,
      selectable: false,
      evented: true,
      opacity: opacity,
      segmentId: segmentId,
      isSegmentPath: false,
      // Blend mode for realistic coloring
      globalCompositeOperation: 'multiply'
    });

    return filledPath;
  }, [opacity]);

  // Update path visualization during drawing
  const updatePathVisualization = useCallback(() => {
    if (!fabricCanvas || !currentPath.length || !activeSegmentId) return;

    // Remove previous temp objects
    tempObjects.forEach(obj => fabricCanvas.remove(obj));
    setTempObjects([]);

    const newTempObjects = [];

    // Create temporary path for current drawing
    if (currentPath.length > 1) {
      const tempPath = createPathFromPoints(currentPath, color);
      if (tempPath) {
        fabricCanvas.add(tempPath);
        newTempObjects.push(tempPath);
      }
    }

    // Draw control points
    currentPath.forEach((point, index) => {
      const circle = new Circle({
        left: point.x - 4,
        top: point.y - 4,
        radius: 4,
        fill: color,
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.9
      });
      fabricCanvas.add(circle);
      newTempObjects.push(circle);
    });

    setTempObjects(newTempObjects);
    fabricCanvas.renderAll();
  }, [fabricCanvas, currentPath, color, activeSegmentId, createPathFromPoints, tempObjects]);

  // Initialize canvas with proper event handling
  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current) return;

    // Create canvas with proper configuration
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1000,
      height: 700,
      backgroundColor: "#1a1a1a",
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    // Load and setup base image
    const imageUrl = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      FabricImage.fromURL(imageUrl).then((fabricImg) => {
        // Calculate proper scaling
        const maxWidth = canvas.width! - 40;
        const maxHeight = canvas.height! - 40;
        const scaleX = maxWidth / img.width;
        const scaleY = maxHeight / img.height;
        const scale = Math.min(scaleX, scaleY);

        fabricImg.scale(scale);
        fabricImg.set({
          left: (canvas.width! - fabricImg.getScaledWidth()) / 2,
          top: (canvas.height! - fabricImg.getScaledHeight()) / 2,
          selectable: false,
          evented: false,
          name: 'baseImage'
        });

        canvas.add(fabricImg);
        canvas.sendObjectToBack(fabricImg);
        setBaseImage(fabricImg);

        canvas.renderAll();
        saveState(canvas);
        toast.success("Image loaded successfully!");
      });

      URL.revokeObjectURL(imageUrl);
    };

    img.src = imageUrl;

    // Configure free drawing brush
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = brushSize;
    canvas.isDrawingMode = false; // Start with drawing mode off

    // Canvas event listeners
    canvas.on('path:created', (e: any) => {
      if (activeSegmentId && activeTool === "pencil") {
        // Add segment identifier to the created path
        e.path.set({
          segmentId: activeSegmentId,
          isSegmentPath: true,
          stroke: color,
          strokeWidth: brushSize,
          opacity: 0.8
        });
      }
      saveState(canvas);
    });

    // Mouse event handling for different tools
    canvas.on('mouse:down', (e: any) => {
      handleCanvasMouseDown(e, canvas);
    });

    canvas.on('mouse:move', (e: any) => {
      handleCanvasMouseMove(e, canvas);
    });

    canvas.on('mouse:up', (e: any) => {
      handleCanvasMouseUp(e, canvas);
    });

    // Object selection handling
    canvas.on('selection:created', (e: any) => {
      handleObjectSelection(e, canvas);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageFile, color, brushSize, activeSegmentId, activeTool, saveState]);

  // Handle mouse down events based on active tool
  const handleCanvasMouseDown = useCallback((e: any, canvas: FabricCanvas) => {
    if (!canvas) return;

    const pointer = canvas.getPointer(e.e);
    const point = { x: pointer.x, y: pointer.y };

    switch (activeTool) {
      case "pencil":
        // Free drawing mode is handled by Fabric.js automatically
        break;

      case "line":
      case "pen":
        if (!activeSegmentId) {
          toast.error("Please create a segment first!");
          return;
        }

        if (!isDrawingPath) {
          // Start new path
          setCurrentPath([point]);
          setIsDrawingPath(true);
        } else {
          // Add point to current path
          let finalPoint = point;

          // Apply angle snapping for line tool
          if (activeTool === "line" && snapAngles && currentPath.length > 0) {
            const lastPoint = currentPath[currentPath.length - 1];
            const dx = point.x - lastPoint.x;
            const dy = point.y - lastPoint.y;
            const angle = Math.atan2(dy, dx);
            const snapAngle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8);
            const distance = Math.sqrt(dx * dx + dy * dy);

            finalPoint = {
              x: lastPoint.x + distance * Math.cos(snapAngle),
              y: lastPoint.y + distance * Math.sin(snapAngle)
            };
          }

          const newPath = [...currentPath, finalPoint];
          setCurrentPath(newPath);

          // Check for path closure (within 15px of start)
          const startPoint = newPath[0];
          const dx = finalPoint.x - startPoint.x;
          const dy = finalPoint.y - startPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (newPath.length > 2 && distance < 15) {
            // Close the path
            finalizePath([...newPath, startPoint], true);
          }
        }
        break;

      case "zoom":
        const newZoom = zoom < 3 ? zoom * 1.2 : 1;
        canvas.setZoom(newZoom);
        setZoom(newZoom);
        break;

      case "eraser":
        // Handle erasing of segment paths
        const target = canvas.findTarget(e.e, false);
        if (target && target.segmentId) {
          canvas.remove(target);
          saveState(canvas);
          toast.success("Segment part erased!");
        }
        break;
    }
  }, [activeTool, activeSegmentId, isDrawingPath, currentPath, snapAngles, zoom]);

  // Handle mouse move events
  const handleCanvasMouseMove = useCallback((e: any, canvas: FabricCanvas) => {
    // Handle real-time preview for certain tools
    if (isDrawingPath && (activeTool === "line" || activeTool === "pen")) {
      // Update temporary visualization
    }
  }, [activeTool, isDrawingPath]);

  // Handle mouse up events
  const handleCanvasMouseUp = useCallback((e: any, canvas: FabricCanvas) => {
    // Handle completion of drawing operations if needed
  }, []);

  // Handle object selection for color filling
  const handleObjectSelection = useCallback((e: any, canvas: FabricCanvas) => {
    const selectedObject = e.selected?.[0];
    if (selectedObject && selectedObject.segmentId) {
      // This is a segment path - we can apply color to it
      setActiveSegmentId(selectedObject.segmentId);
    }
  }, []);

  // Finalize current path and create segment
  const finalizePath = useCallback((pathPoints: Point[], closed: boolean) => {
    if (!activeSegmentId || !fabricCanvas) return;

    // Remove temp objects
    tempObjects.forEach(obj => fabricCanvas.remove(obj));
    setTempObjects([]);

    // Create final path object
    const pathObj = createPathFromPoints(pathPoints, color, activeSegmentId);
    if (pathObj) {
      fabricCanvas.add(pathObj);
      fabricCanvas.bringObjectToFront(pathObj);
    }

    // Update segment data
    setSegments(prev => prev.map(segment =>
      segment.id === activeSegmentId
        ? { ...segment, points: pathPoints, closed }
        : segment
    ));

    setCurrentPath([]);
    setIsDrawingPath(false);
    saveState(fabricCanvas);

    if (closed) {
      toast.success("Segment completed! You can now apply colors to it.");
    } else {
      toast.success("Path segment added!");
    }
  }, [activeSegmentId, fabricCanvas, tempObjects, createPathFromPoints, color, saveState]);

  // Apply color to a segment
  const applyColorToSegment = useCallback((segmentId: string, fillColor: string) => {
    if (!fabricCanvas) return;

    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.closed || segment.points.length < 3) {
      toast.error("Segment must be closed to apply color!");
      return;
    }

    // Remove existing fill for this segment
    const existingFills = fabricCanvas.getObjects().filter((obj: any) =>
      obj.segmentId === segmentId && !obj.isSegmentPath
    );
    existingFills.forEach(obj => fabricCanvas.remove(obj));

    // Create new filled region
    const filledRegion = createFilledRegion(segment.points, fillColor, segmentId);
    if (filledRegion) {
      fabricCanvas.add(filledRegion);

      // Position it correctly in the layer stack
      if (baseImage) {
        fabricCanvas.moveTo(filledRegion, fabricCanvas.getObjects().indexOf(baseImage) + 1);
      }

      fabricCanvas.renderAll();
      saveState(fabricCanvas);

      // Update segment color
      setSegments(prev => prev.map(segment =>
        segment.id === segmentId ? { ...segment, color: fillColor } : segment
      ));

      toast.success("Color applied to segment!");
    }
  }, [fabricCanvas, segments, createFilledRegion, baseImage, saveState]);

  // Tool change handler
  const handleToolChange = useCallback((tool: DrawingTool) => {
    if (!fabricCanvas) return;

    setActiveTool(tool);

    // Clear any ongoing path
    if (tempObjects.length > 0) {
      tempObjects.forEach(obj => fabricCanvas.remove(obj));
      setTempObjects([]);
      fabricCanvas.renderAll();
    }

    setCurrentPath([]);
    setIsDrawingPath(false);

    // Configure canvas based on tool
    switch (tool) {
      case "pencil":
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = brushSize;
        fabricCanvas.selection = false;
        break;

      case "eraser":
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = true;
        break;

      case "line":
      case "pen":
      case "zoom":
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = false;
        break;

      default:
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = true;
    }
  }, [fabricCanvas, tempObjects, color, brushSize]);

  // Segment management functions
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

  const handleSegmentSelect = (segmentId: string) => {
    setActiveSegmentId(segmentId);

    // If the segment is closed, allow color application
    const segment = segments.find(s => s.id === segmentId);
    if (segment && segment.closed) {
      toast.info("Segment selected. Use Color Picker to apply colors.");
    }
  };

  const handleSegmentDelete = (segmentId: string) => {
    if (!fabricCanvas) return;

    // Remove all objects related to this segment
    const segmentObjects = fabricCanvas.getObjects().filter((obj: any) => obj.segmentId === segmentId);
    segmentObjects.forEach(obj => fabricCanvas.remove(obj));

    fabricCanvas.renderAll();
    setSegments(prev => prev.filter(seg => seg.id !== segmentId));

    if (activeSegmentId === segmentId) {
      setActiveSegmentId(null);
    }

    saveState(fabricCanvas);
    toast.success("Segment deleted!");
  };

  const handleSegmentToggleVisibility = (segmentId: string) => {
    if (!fabricCanvas) return;

    const segmentObjects = fabricCanvas.getObjects().filter((obj: any) => obj.segmentId === segmentId);
    const segment = segments.find(s => s.id === segmentId);

    if (segment) {
      const newVisibility = !segment.visible;
      segmentObjects.forEach((obj: any) => {
        obj.set('visible', newVisibility);
      });

      setSegments(prev => prev.map(segment =>
        segment.id === segmentId ? { ...segment, visible: newVisibility } : segment
      ));

      fabricCanvas.renderAll();
    }
  };

  // History functions
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

  // Export function
  const handleDownload = () => {
    if (!fabricCanvas) return;

    // Hide all segment outline paths for clean export
    const segmentPaths = fabricCanvas.getObjects().filter((obj: any) => obj.isSegmentPath);
    segmentPaths.forEach((obj: any) => obj.set('visible', false));

    fabricCanvas.renderAll();

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    // Restore visibility
    segmentPaths.forEach((obj: any) => obj.set('visible', true));
    fabricCanvas.renderAll();

    const link = document.createElement('a');
    link.download = 'colorized-image.png';
    link.href = dataURL;
    link.click();

    toast.success("Image downloaded!");
  };

  // Color change handler
  const handleColorChange = (newColor: string) => {
    setColor(newColor);

    if (fabricCanvas) {
      fabricCanvas.freeDrawingBrush.color = newColor;

      // If a segment is selected and closed, apply color immediately
      if (activeSegmentId) {
        const segment = segments.find(s => s.id === activeSegmentId);
        if (segment && segment.closed) {
          applyColorToSegment(activeSegmentId, newColor);
        }
      }
    }
  };

  // Effects
  useEffect(() => {
    updatePathVisualization();
  }, [updatePathVisualization]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [fabricCanvas, brushSize]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-text">Image Colorization Studio</h1>
            <p className="text-muted-foreground">Professional segmentation and colorization tools</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              Download PNG
            </Button>
            <Button variant="outline" onClick={onBack}>
              ← Back to Upload
            </Button>
          </div>
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
            onSegmentSelect={handleSegmentSelect}
            onSegmentCreate={handleSegmentCreate}
            onSegmentDelete={handleSegmentDelete}
            onSegmentToggleVisibility={handleSegmentToggleVisibility}
            onSegmentColorChange={(id, color) => applyColorToSegment(id, color)}
          />

          <ColorPicker
            color={color}
            onChange={handleColorChange}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="glass-panel p-6 rounded-xl shadow-card">
            <canvas
              ref={canvasRef}
              className="border border-border rounded-lg shadow-neon-strong"
              style={{ cursor: activeTool === 'zoom' ? 'zoom-in' : activeTool === 'eraser' ? 'crosshair' : 'crosshair' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};