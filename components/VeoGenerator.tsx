import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Film, Loader2, AlertCircle } from 'lucide-react';

const VeoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('Cinematic shot of this device floating in a futuristic server room, neon lights, 4k');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API usage
        const base64Data = base64String.split(',')[1];
        setImageBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setVideoUrl(null);
    setIsGenerating(true);
    setStatusMessage('Checking API Key permissions...');

    try {
      // 1. Check/Request API Key via AI Studio wrapper
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await win.aistudio.openSelectKey();
          // Assuming successful selection if promise resolves
        }
      }

      // 2. Initialize Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setStatusMessage('Initializing Veo model...');

      // 3. Prepare Payload
      const config = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9', // Landscape for desktop view
      };

      let operation;
      
      setStatusMessage('Sending request to Veo 3.1...');
      
      if (imageBase64) {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
              imageBytes: imageBase64,
              mimeType: 'image/png', // Simplified assumption, in prod extract from file
            },
            config: config
          });
      } else {
         operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: config
          });
      }

      // 4. Poll for completion
      setStatusMessage('Generating video (this may take a minute)...');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s polling
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      // 5. Fetch result
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatusMessage('Downloading generated video...');
        // Append API key for download auth
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoResponse.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        throw new Error("No video URI returned from operation.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
        setError("API Key session expired or invalid. Please try again to re-select key.");
        const win = window as any;
        if (win.aistudio) {
            await win.aistudio.openSelectKey();
        }
      } else {
        setError(err.message || "An unexpected error occurred during generation.");
      }
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Film className="text-cyan-400" />
          Veo Studio
        </h1>
        <p className="text-gray-400">
          Upload a device screenshot or photo to generate a promotional video using Google's Veo 3.1 model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-[#2b2d31] p-6 rounded-xl border border-gray-700 shadow-lg">
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Source Image (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-gray-800 transition-colors"
            >
              {imageBase64 ? (
                <div className="text-cyan-400 flex flex-col items-center">
                   <Upload size={32} className="mb-2"/>
                   <span className="text-sm">Image Loaded</span>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <Upload size={32} className="mb-2"/>
                  <span className="text-sm">Click to upload device photo</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none h-32 resize-none"
              placeholder="Describe how you want the video to look..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              isGenerating 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {statusMessage}
              </>
            ) : (
              <>
                <Film size={20} />
                Generate Video
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Uses <span className="font-mono text-gray-400">veo-3.1-fast-generate-preview</span>. Requires billed project API Key.
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#1e1f22] rounded-xl border border-gray-800 overflow-hidden flex items-center justify-center min-h-[400px]">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-gray-600 p-8">
              <Film size={48} className="mx-auto mb-4 opacity-20" />
              <p>Generated video will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VeoGenerator;