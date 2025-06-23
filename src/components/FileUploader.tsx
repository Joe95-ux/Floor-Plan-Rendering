import React, { useState } from "react";

interface PreviewFile {
  name: string;
  url: string;
  type: string;
}

const FileUploader: React.FC = () => {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
};

export default FileUploader; 