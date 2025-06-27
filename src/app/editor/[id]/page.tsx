import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Stage, Layer, Rect, Line, Text, Group, Image as KonvaImage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { saveAs } from "file-saver";

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
}

interface LayerData {
  id: string;
  type: "room" | "wall" | "furniture" | "text";
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
}

const MOCK_LAYERS: LayerData[] = [
  { id: "r1", type: "room", name: "Room 1", x: 100, y: 100, width: 200, height: 150 },
  { id: "w1", type: "wall", name: "Wall 1", x: 100, y: 100, points: [100, 100, 300, 100] },
  { id: "f1", type: "furniture", name: "Bed", x: 150, y: 180, width: 60, height: 30 },
  { id: "t1", type: "text", name: "12'-0\"", x: 120, y: 90 },
];

const MOCK_AI_LAYERS: LayerData[] = [
  { id: "r2", type: "room", name: "Living Room", x: 80, y: 80, width: 220, height: 160 },
  { id: "w2", type: "wall", name: "Wall 2", x: 80, y: 80, points: [80, 80, 300, 80] },
  { id: "f2", type: "furniture", name: "Sofa", x: 120, y: 200, width: 80, height: 30 },
  { id: "t2", type: "text", name: "5.5", x: 110, y: 70 },
];

export default function EditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const stageRef = useRef<KonvaStage | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scalingMode, setScalingMode] = useState(false);
  const [scalePoints, setScalePoints] = useState<{ x: number; y: number }[]>([]);
  const [scale, setScale] = useState<number | null>(null);
  const [autoScalingMode, setAutoScalingMode] = useState(false);
  const [autoScaleValue, setAutoScaleValue] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloorPlan = async () => {
      const res = await fetch(`/api/floorplans?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setFloorPlan(data);
        if (data.imageUrl) {
          const img = new window.Image();
          img.src = data.imageUrl;
          img.onload = () => setImage(img);
        }
      }
    };
    fetchFloorPlan();
    // For demo, use mock layers
    setLayers(MOCK_LAYERS);
  }, [id]);

  const handleStageClick = (e?: KonvaEventObject<MouseEvent>) => {
    if (scalingMode && e) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          setScalePoints(prev => [...prev, pointer]);
        }
      }
      return;
    }
    if (autoScalingMode && autoScaleValue !== null && e) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          setScalePoints(prev => [...prev, pointer]);
        }
      }
      return;
    }
    setSelected(null);
    setContextMenu(null);
  };

  const handleLayerClick = (layerId: string) => {
    if (autoScalingMode) {
      const layer = layers.find(l => l.id === layerId);
      if (layer?.type === "text") {
        // Mock OCR: extract number from text
        const match = layer.name.match(/([\d.']+)/);
        if (match) {
          const value = match[1].replace("'", "");
          setAutoScaleValue(Number(value));
          setScalePoints([]);
        }
      }
      return;
    }
    setSelected(layerId);
    setContextMenu(null);
  };

  const handleLayerContextMenu = (e: KonvaEventObject<MouseEvent>, layerId: string) => {
    e.evt.preventDefault();
    setSelected(layerId);
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, layerId });
    setRenameValue(layers.find(l => l.id === layerId)?.name || "");
  };

  const handleRename = () => {
    setLayers(layers.map(l => l.id === contextMenu?.layerId ? { ...l, name: renameValue } : l));
    setContextMenu(null);
  };

  const runAISegmentation = () => {
    setAiLoading(true);
    setAiDone(false);
    setTimeout(() => {
      setLayers(MOCK_AI_LAYERS);
      setAiLoading(false);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 2000);
    }, 1500);
  };

  useEffect(() => {
    if (scalingMode && scalePoints.length === 2) {
      const [p1, p2] = scalePoints;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      const realDist = window.prompt("Enter real-world distance between points (in meters):", "1.0");
      if (realDist && !isNaN(Number(realDist)) && Number(realDist) > 0) {
        setScale(pixelDist / Number(realDist));
      }
      setScalingMode(false);
      setScalePoints([]);
    }
    if (autoScalingMode && autoScaleValue && scalePoints.length === 2) {
      const [p1, p2] = scalePoints;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      setScale(pixelDist / autoScaleValue);
      setAutoScalingMode(false);
      setAutoScaleValue(null);
      setScalePoints([]);
    }
  }, [scalingMode, autoScalingMode, scalePoints, autoScaleValue]);

  const exportPNG = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${floorPlan?.name || "floorplan"}.png`;
      link.href = uri;
      link.click();
      setExportMsg("PNG exported!");
    }
  };

  const exportJSON = () => {
    const data = {
      floorPlan,
      layers,
      scale,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, `${floorPlan?.name || "floorplan"}.json`);
    setExportMsg("JSON exported!");
  };

  const exportCSV = () => {
    const roomLayers = layers.filter(l => l.type === "room");
    let csv = "Room Name, X, Y, Width, Height\n";
    roomLayers.forEach(l => {
      csv += `${l.name},${l.x},${l.y},${l.width || ""},${l.height || ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `${floorPlan?.name || "floorplan"}_rooms.csv`);
    setExportMsg("CSV exported!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Floor Plan Editor</h1>
      {floorPlan && (
        <div className="mb-4">
          <span className="font-semibold">Project:</span> {floorPlan.name}
        </div>
      )}
      <div className="mb-2 flex items-center gap-4">
        <button
          className={`px-3 py-1 rounded ${scalingMode ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-700"}`}
          onClick={() => {
            setScalingMode(!scalingMode);
            setAutoScalingMode(false);
            setScalePoints([]);
          }}
        >
          {scalingMode ? "Cancel Scaling" : "Manual Scale"}
        </button>
        <button
          className={`px-3 py-1 rounded ${autoScalingMode ? "bg-green-700 text-white" : "bg-green-100 text-green-700"}`}
          onClick={() => {
            setAutoScalingMode(!autoScalingMode);
            setScalingMode(false);
            setAutoScaleValue(null);
            setScalePoints([]);
          }}
        >
          {autoScalingMode ? "Cancel Auto Scale" : "Auto Scale (OCR)"}
        </button>
        <button
          className="px-3 py-1 rounded bg-purple-600 text-white"
          onClick={runAISegmentation}
          disabled={aiLoading}
        >
          {aiLoading ? "Running AI..." : "Run AI Segmentation"}
        </button>
        {aiDone && <span className="text-purple-700">Segmentation complete!</span>}
        {scale && (
          <span className="text-sm text-gray-700">Scale: {scale.toFixed(2)} px/m</span>
        )}
        {autoScalingMode && !autoScaleValue && (
          <span className="text-sm text-green-700">Click a dimension label</span>
        )}
        {autoScalingMode && autoScaleValue && (
          <span className="text-sm text-green-700">Now click two points for this value</span>
        )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={exportPNG}>Export PNG</button>
        <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={exportJSON}>Export JSON</button>
        <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={exportCSV}>Export CSV</button>
        {exportMsg && <span className="text-green-700 ml-2">{exportMsg}</span>}
      </div>
      <div className="relative bg-white rounded shadow-lg mx-auto" style={{ width: 600, height: 400 }}>
        <Stage
          width={600}
          height={400}
          ref={stageRef}
          onClick={handleStageClick}
          className="cursor-crosshair"
        >
          <Layer>
            {floorPlan && (
              <Group>
                {image && (
                  <KonvaImage
                    image={image}
                    x={0}
                    y={0}
                    width={600}
                    height={400}
                  />
                )}
                {/* Draw scale points and line if in scaling mode */}
                {scalingMode && scalePoints.length > 0 && (
                  <>
                    {scalePoints.map((pt, idx) => (
                      <Rect
                        key={idx}
                        x={pt.x - 4}
                        y={pt.y - 4}
                        width={8}
                        height={8}
                        fill="#f59e42"
                      />
                    ))}
                    {scalePoints.length === 2 && (
                      <Line
                        points={[scalePoints[0].x, scalePoints[0].y, scalePoints[1].x, scalePoints[1].y]}
                        stroke="#f59e42"
                        strokeWidth={3}
                      />
                    )}
                  </>
                )}
              </Group>
            )}
            {layers.map(layer => {
              if (layer.type === "room") {
                return (
                  <Rect
                    key={layer.id}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    fill={selected === layer.id ? "#c7e0ff" : "#e0e7ef"}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    onClick={() => handleLayerClick(layer.id)}
                    onContextMenu={e => handleLayerContextMenu(e, layer.id)}
                  />
                );
              }
              if (layer.type === "wall") {
                return (
                  <Line
                    key={layer.id}
                    points={layer.points || []}
                    stroke="#6366f1"
                    strokeWidth={4}
                    lineCap="round"
                    onClick={() => handleLayerClick(layer.id)}
                    onContextMenu={e => handleLayerContextMenu(e, layer.id)}
                  />
                );
              }
              if (layer.type === "furniture") {
                return (
                  <Rect
                    key={layer.id}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    fill={selected === layer.id ? "#fef08a" : "#f3f4f6"}
                    stroke="#f59e42"
                    strokeWidth={2}
                    onClick={() => handleLayerClick(layer.id)}
                    onContextMenu={e => handleLayerContextMenu(e, layer.id)}
                  />
                );
              }
              if (layer.type === "text") {
                return (
                  <Text
                    key={layer.id}
                    x={layer.x}
                    y={layer.y}
                    text={layer.name}
                    fontSize={18}
                    fill="#222"
                    onClick={() => handleLayerClick(layer.id)}
                    onContextMenu={e => handleLayerContextMenu(e, layer.id)}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
        {contextMenu && (
          <div
            className="absolute bg-white border rounded shadow p-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="mb-2 font-medium">Rename Layer</div>
            <input
              className="border rounded p-1 mb-2 w-full"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white rounded px-2 py-1 text-sm"
              onClick={handleRename}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 