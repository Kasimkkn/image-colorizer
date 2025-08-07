import { CanvasEditor } from "@/components/CanvasEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { Palette } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = (file: File) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedImage(file);
      setIsLoading(false);
    }, 1000);
  };

  const handleBack = () => {
    setSelectedImage(null);
  };

  if (selectedImage) {
    return <CanvasEditor imageFile={selectedImage} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-2">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-neon p-4 rounded-full shadow-neon-strong">
              <Palette className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold neon-text leading-tight">
            Advanced Image Colorization Studio
          </h1>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Upload your image to begin the colorization process
            </p>
          </div>

          <ImageUploader
            onImageSelect={handleImageSelect}
            isLoading={isLoading}
          />
        </div>

      </div>
    </div>
  );
};

export default Index;