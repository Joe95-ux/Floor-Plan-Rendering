import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PreviewFile {
  name: string;
  url: string;
  type: string;
}

interface Project {
  id: string;
  name: string;
}

const FileUploader: React.FC = () => {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [floorPlanName, setFloorPlanName] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [userId] = useState<string>("demo-user"); // Replace with session userId in production
  const router = useRouter();

  const fetchProjects = async () => {
    const res = await fetch(`/api/projects?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    setError(null);
    const previewList: PreviewFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        previewList.push({ name: file.name, url: data.url, type: file.type });
        setUploadedUrl(data.url);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Upload failed");
        }
      }
    }
    setPreviews(previewList);
    setUploading(false);
    await fetchProjects();
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let projectId = selectedProject;
    if (!projectId && newProjectName) {
      // Create new project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, userId }),
      });
      const data = await res.json();
      projectId = data.id;
    }
    if (!projectId || !floorPlanName || !uploadedUrl) {
      setError("Please fill all fields");
      return;
    }
    // Create floor plan
    await fetch("/api/floorplans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: floorPlanName, imageUrl: uploadedUrl }),
    });
    setShowModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md w-full max-w-lg mx-auto">
      <label className="block mb-2 font-semibold">Upload Floor Plan (JPEG, PNG, SVG, PDF)</label>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.svg,.pdf"
        multiple
        onChange={handleFiles}
        className="mb-4"
      />
      {uploading && <div className="text-blue-600 mb-2">Uploading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex flex-wrap gap-4">
        {previews.map((file, idx) => (
          <div key={idx} className="w-32 h-32 border rounded flex flex-col items-center justify-center bg-gray-50">
            {file.type.startsWith("image/") ? (
              <img src={file.url} alt={file.name} className="object-contain w-full h-full" />
            ) : file.type === "application/pdf" ? (
              <span className="text-xs text-gray-700">PDF: {file.name}</span>
            ) : null}
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow-lg w-80 flex flex-col gap-4">
            <h2 className="font-bold text-lg mb-2">Save Floor Plan</h2>
            <label className="text-sm">Select Project</label>
            <select
              className="border rounded p-1"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              <option value="">-- New Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {!selectedProject && (
              <input
                type="text"
                className="border rounded p-1"
                placeholder="New project name"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
              />
            )}
            <input
              type="text"
              className="border rounded p-1"
              placeholder="Floor plan name"
              value={floorPlanName}
              onChange={e => setFloorPlanName(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 text-white rounded p-2 mt-2">Save</button>
            <button type="button" className="text-gray-600 mt-1" onClick={() => setShowModal(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 