import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { CanvasEditor } from "@/components/CanvasEditor";
import { Sparkles, Palette, Layers, Wand2 } from "lucide-react";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = (file: File) => {
    setIsLoading(true);
    // Simulate processing time
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
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="bg-gradient-neon p-4 rounded-full shadow-neon-strong">
              <Palette className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold neon-text leading-tight">
            Advanced Image
            <br />
            Colorization Studio
          </h1>
          
          <p className="text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your black & white images into vibrant masterpieces with professional-grade colorization tools. 
            Paint with precision, blend with perfection.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-panel p-6 rounded-xl shadow-card text-center space-y-4">
            <div className="w-12 h-12 bg-tool-brush/20 rounded-lg flex items-center justify-center mx-auto">
              <Wand2 className="h-6 w-6 text-tool-brush" />
            </div>
            <h3 className="text-lg font-semibold">Precision Tools</h3>
            <p className="text-sm text-muted-foreground">
              Advanced brush and selection tools for detailed colorization work
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl shadow-card text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Layer System</h3>
            <p className="text-sm text-muted-foreground">
              Multi-layer canvas for non-destructive editing and complex compositions
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl shadow-card text-center space-y-4">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Professional Quality</h3>
            <p className="text-sm text-muted-foreground">
              Export high-resolution images ready for print or digital use
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold neon-text mb-2">
              Get Started
            </h2>
            <p className="text-muted-foreground">
              Upload your image to begin the colorization process
            </p>
          </div>

          <ImageUploader 
            onImageSelect={handleImageSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Professional colorization tools for artists, photographers, and creative professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;