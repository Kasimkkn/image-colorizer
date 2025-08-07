import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
}

export const ImageUploader = ({ onImageSelect, isLoading }: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WEBP)");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    onImageSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          dragActive
            ? "border-primary bg-primary/5 shadow-neon"
            : "border-border hover:border-primary/50"
        } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon">
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold neon-text">
              Upload Your Image
            </h3>
            <p className="text-muted-foreground">
              Drag & drop your image here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WEBP • Max 10MB
            </p>
          </div>

          <Button
            variant="neon"
            size="lg"
            onClick={() => document.getElementById("file-input")?.click()}
            disabled={isLoading}
            className="mx-auto"
          >
            <ImageIcon className="h-5 w-5" />
            Choose Image
          </Button>

          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <div className="text-primary font-semibold text-lg">Drop your image here!</div>
          </div>
        )}
      </div>
    </div>
  );
};