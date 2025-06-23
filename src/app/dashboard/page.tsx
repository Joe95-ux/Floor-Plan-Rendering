import React, { useEffect, useState } from "react";
import Link from "next/link";

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
}

interface Project {
  id: string;
  name: string;
  floorPlans: FloorPlan[];
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "demo-user"; // Replace with session userId in production

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch(`/api/projects?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Projects & Floor Plans</h1>
      {loading ? (
        <div>Loading...</div>
      ) : projects.length === 0 ? (
        <div>No projects found. Upload a floor plan to get started.</div>
      ) : (
        <div className="space-y-6">
          {projects.map(project => (
            <div key={project.id} className="border rounded-lg p-4 bg-white shadow">
              <h2 className="font-semibold text-lg mb-2">{project.name}</h2>
              {project.floorPlans.length === 0 ? (
                <div className="text-gray-500">No floor plans yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.floorPlans.map(fp => (
                    <div key={fp.id} className="border rounded p-2 flex flex-col items-center">
                      <img src={fp.imageUrl} alt={fp.name} className="w-32 h-32 object-contain mb-2" />
                      <div className="font-medium mb-1">{fp.name}</div>
                      <Link href={`/editor/${fp.id}`} className="text-blue-600 underline text-sm">Open Editor</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 