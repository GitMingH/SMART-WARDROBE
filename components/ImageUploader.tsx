import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, label = "上传图片" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer active:bg-slate-100 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-2xl">
            📷
          </div>
          <span className="text-slate-500 font-medium text-sm">{label}</span>
          <span className="text-slate-400 text-xs mt-1">支持拍照或从相册选择</span>
        </div>
      ) : (
        <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-sm bg-slate-100">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
              if(fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;