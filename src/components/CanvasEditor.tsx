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

  // Handle mouse down events based on active tool
  const handleCanvasMouseDown = useCallback((e: any) => {
    if (!fabricCanvas) return;

    const pointer = fabricCanvas.getPointer(e.e);
    const point = { x: pointer.x, y: pointer.y };

    console.log(`Tool: ${activeTool}, Point: ${point.x}, ${point.y}`); // Debug log

    switch (activeTool) {
      case "pencil":
        // Free drawing mode is handled by Fabric.js automatically
        console.log("Pencil tool - free drawing mode should be active");
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
          console.log("Started new path");
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
        fabricCanvas.setZoom(newZoom);
        setZoom(newZoom);
        break;

      case "eraser":
        // Handle erasing of segment paths
        const target = fabricCanvas.findTarget(e.e, false);
        if (target && (target as any).segmentId) {
          fabricCanvas.remove(target);
          saveState(fabricCanvas);
          toast.success("Segment part erased!");
        }
        break;
    }
  }, [activeTool, activeSegmentId, isDrawingPath, currentPath, snapAngles, zoom, fabricCanvas]);

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

    console.log(`Changing tool to: ${tool}`); // Debug log

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
        console.log("Pencil tool activated - free drawing mode ON");
        break;

      case "eraser":
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = true;
        console.log("Eraser tool activated");
        break;

      case "line":
      case "pen":
      case "zoom":
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = false;
        console.log(`${tool} tool activated`);
        break;

      default:
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = true;
    }
  }, [fabricCanvas, tempObjects, color, brushSize]);

  // Initialize canvas with proper event handling
  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current) return;

    console.log("Initializing canvas..."); // Debug log

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
        console.log("Image loaded and canvas initialized"); // Debug log
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
      console.log("Path created event fired"); // Debug log
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
    canvas.on('mouse:down', handleCanvasMouseDown);

    // Object selection handling
    canvas.on('selection:created', (e: any) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && (selectedObject as any).segmentId) {
        // This is a segment path - we can apply color to it
        setActiveSegmentId((selectedObject as any).segmentId);
      }
    });

    setFabricCanvas(canvas);
    console.log("Canvas setup complete"); // Debug log

    return () => {
      canvas.dispose();
    };
  }, [imageFile, color, brushSize, activeSegmentId, activeTool, saveState, handleCanvasMouseDown]);

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

  // Debug: Log current tool and canvas state
  useEffect(() => {
    if (fabricCanvas) {
      console.log(`Current tool: ${activeTool}, Drawing mode: ${fabricCanvas.isDrawingMode}, Selection: ${fabricCanvas.selection}`);
    }
  }, [activeTool, fabricCanvas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-indigo-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Colorization Studio</h1>
                <p className="text-slate-500 font-medium">Professional image editing & segmentation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                onClick={handleDownload}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 border-0 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PNG
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
              >
                ← Back to Upload
              </Button>
            </div>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Drawing Tools */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Segmentation Manager */}
          <div className="lg:col-span-2">
            <SegmentationManager
              segments={segments}
              activeSegmentId={activeSegmentId}
              onSegmentSelect={handleSegmentSelect}
              onSegmentCreate={handleSegmentCreate}
              onSegmentDelete={handleSegmentDelete}
              onSegmentToggleVisibility={handleSegmentToggleVisibility}
              onSegmentColorChange={(id, color) => applyColorToSegment(id, color)}
            />
          </div>

          {/* Color Picker */}
          <div className="lg:col-span-1">
            <ColorPicker
              color={color}
              onChange={handleColorChange}
              opacity={opacity}
              onOpacityChange={setOpacity}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-indigo-500/10">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Canvas Ready
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Tool: <span className="font-semibold text-indigo-600">{activeTool}</span></span>
                <span>Zoom: <span className="font-semibold">{Math.round(zoom * 100)}%</span></span>
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border-2 border-slate-200 rounded-xl shadow-2xl shadow-slate-900/20 bg-slate-900"
                style={{
                  cursor: activeTool === 'zoom' ? 'zoom-in' : activeTool === 'eraser' ? 'crosshair' : 'crosshair',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />

              {/* Canvas overlay indicators */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {activeSegmentId && (
                  <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
                    Active: {segments.find(s => s.id === activeSegmentId)?.name}
                  </div>
                )}
                {isDrawingPath && (
                  <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg animate-pulse">
                    Drawing in progress...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span>Canvas: <span className="font-semibold">{fabricCanvas ? "Ready" : "Loading..."}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Segments: <span className="font-semibold">{segments.length}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Brush: <span className="font-semibold">{brushSize}px</span></span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Professional Editing Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};