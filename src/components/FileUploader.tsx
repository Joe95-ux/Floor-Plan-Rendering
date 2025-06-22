import React, { useState } from "react";

interface PreviewFile {
  name: string;
  url: string;
  type: string;
}

const FileUploader: React.FC = () => {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const previewList: PreviewFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === "application/pdf") {
        // For demo: just show PDF icon/filename (multi-page preview can be added later)
        previewList.push({ name: file.name, url: "", type: file.type });
      } else {
        const url = URL.createObjectURL(file);
        previewList.push({ name: file.name, url, type: file.type });
      }
    }
    setPreviews(previewList);
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