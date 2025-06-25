import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Stage, Layer, Rect, Line, Text, Group, Image as KonvaImage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import useImage from "use-image";

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

  const handleStageClick = () => {
    setSelected(null);
    setContextMenu(null);
  };

  const handleLayerClick = (layerId: string) => {
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Floor Plan Editor</h1>
      {floorPlan && (
        <div className="mb-4">
          <span className="font-semibold">Project:</span> {floorPlan.name}
        </div>
      )}
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