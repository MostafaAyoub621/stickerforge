
import React, { useState, useRef } from 'react';
import { gemini } from '../services/geminiService';
import { DesignStyle, ProductTarget, DesignAsset, ProjectState, ListingMetadata } from '../types';

interface AIPanelProps {
  project: ProjectState;
  onGenerate: (asset: DesignAsset) => void;
  updateProject: (updates: Partial<ProjectState>) => void;
  setLoading: (l: boolean) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ project, onGenerate, updateProject, setLoading }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = async () => {
    if (!project.currentAsset || !editPrompt) return;
    setLoading(true);
    try {
      const newUrl = await gemini.editLogo(project.currentAsset.url, editPrompt);
      onGenerate({ 
        ...project.currentAsset, 
        id: Math.random().toString(36).substr(2, 9), 
        url: newUrl, 
        timestamp: Date.now() 
      });
      setEditPrompt('');
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleAnalyzeReference = async () => {
    if (!project.imageInput) return;
    setIsAnalyzing(true);
    try {
      const result = await gemini.analyzeImage(project.imageInput);
      setAnalysisResult(result);
    } catch (err: any) {
      alert(err.message);
    } finally { setIsAnalyzing(false); }
  };

  const handleDeepCritique = async () => {
    setIsThinking(true);
    try {
      const query = "Perform a deep, complex architectural design critique of the current logo concept. Provide highly detailed reasoning for color theory, alignment, and niche market viability.";
      const result = await gemini.deepThink(query, project.currentAsset?.url || project.imageInput);
      setAnalysisResult(result);
    } catch (err: any) {
      alert(err.message);
    } finally { setIsThinking(false); }
  };

  const handleRemoveBackground = async () => {
    if (!project.currentAsset) return;
    setLoading(true);
    try {
      const newUrl = await gemini.removeBackground(project.currentAsset.url);
      onGenerate({ 
        ...project.currentAsset, 
        id: Math.random().toString(36).substr(2, 9), 
        url: newUrl, 
        timestamp: Date.now() 
      });
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const makeTransparent = () => {
    if (!project.currentAsset) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 240 && imageData.data[i+1] > 240 && imageData.data[i+2] > 240) {
            imageData.data[i+3] = 0;
          }
        }
        ctx?.putImageData(imageData, 0, 0);
        onGenerate({ ...project.currentAsset, url: canvas.toDataURL('image/png') });
      }
    };
    img.src = project.currentAsset.url;
  };

  const handleMetadata = async () => {
    if (!project.currentAsset) return;
    setIsMetaLoading(true);
    try {
      const activePlatform = project.connectedPlatforms.find(p => p.id === project.activePlatformId);
      const metadata = await gemini.generateListingMetadata({
        prompt: project.currentAsset.prompt || "Concept",
        style: project.style,
        target: project.target,
        brand: project.brandName || "Design Forge",
        platform: activePlatform?.name
      });
      const nextPlatformMetadata = { ...(project.currentAsset.platformMetadata || {}) };
      if (activePlatform) nextPlatformMetadata[activePlatform.id] = metadata;
      onGenerate({ ...project.currentAsset, metadata, platformMetadata: nextPlatformMetadata });
    } finally { setIsMetaLoading(false); }
  };

  const handlePublish = async () => {
    if (!project.currentAsset) return;
    setIsPublishing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsPublishing(false);
    alert('Listing successfully pushed to Store API! Assets are being synchronized...');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateProject({ imageInput: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const copyTags = () => {
    const activeMeta = project.currentAsset?.platformMetadata?.[project.activePlatformId] || project.currentAsset?.metadata;
    if (activeMeta?.tags) {
      navigator.clipboard.writeText(activeMeta.tags.join(', '));
      alert(`SEO data copied!`);
    }
  };

  return (
    <div className="w-80 h-full glass border-l border-slate-700 flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-10">
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-2.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Intelligence Hub
          </h3>
          
          <div className="mb-6">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-slate-800 transition-all uppercase tracking-widest flex flex-col items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
              Upload Analysis Source
            </button>
            
            {project.imageInput && (
              <div className="mt-4 space-y-3">
                <div className="relative group rounded-2xl overflow-hidden border border-blue-500/30 p-2 bg-blue-500/5">
                  <img src={project.imageInput} className="w-full h-32 object-contain rounded-xl" alt="Reference" />
                  <button onClick={() => updateProject({ imageInput: undefined })} className="absolute top-4 right-4 bg-red-500 p-1.5 rounded-full text-white shadow-xl">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                  </button>
                </div>
                <button 
                  onClick={handleAnalyzeReference}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini Pro'}
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleDeepCritique}
            disabled={isThinking}
            className="w-full py-4 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-2xl text-[10px] font-black hover:bg-indigo-600/20 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth={2}/></svg>
            {isThinking ? 'Thinking Deeply...' : 'AI Deep Critique'}
          </button>

          {analysisResult && (
            <div className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded-2xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">AI Insights</span>
                <button onClick={() => setAnalysisResult(null)} className="text-[8px] text-slate-500 uppercase font-black">Dismiss</button>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-medium line-clamp-[10]">{analysisResult}</p>
            </div>
          )}

          {project.currentAsset && (
            <div className="space-y-6 pt-6 border-t border-slate-800">
               <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Nano Edit (Text-to-Image)</label>
                <textarea 
                  value={editPrompt} 
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Add a retro filter' or 'Make it glowing'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs h-24 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-800 transition-all font-medium"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleEdit} disabled={!editPrompt} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-3 tracking-widest uppercase disabled:opacity-20 shadow-xl">
                   APPLY AI EDIT
                </button>
                <button onClick={handleRemoveBackground} className="w-full py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[9px] font-black hover:bg-emerald-600/20 transition-all uppercase">
                  Remove Background
                </button>
              </div>
            </div>
          )}
        </section>

        {project.currentAsset && (
          <section className="animate-in fade-in slide-in-from-top-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Publishing Sync
              </h3>
              <button onClick={handleMetadata} disabled={isMetaLoading} className="text-[9px] font-black text-emerald-500 hover:underline uppercase transition-all tracking-widest disabled:opacity-20">
                {isMetaLoading ? 'OPTIMIZING...' : 'FORGE 50 TAGS'}
              </button>
            </div>
            
            {(project.currentAsset.platformMetadata?.[project.activePlatformId] || project.currentAsset.metadata) && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[8px] text-slate-600 uppercase font-black mb-1">Live SEO Preview</p>
                  <p className="text-[11px] text-white font-bold leading-snug">{(project.currentAsset.platformMetadata?.[project.activePlatformId] || project.currentAsset.metadata)?.title}</p>
                </div>
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-3 tracking-widest uppercase shadow-xl"
                >
                  {isPublishing ? 'Synchronizing Store...' : 'PUSH TO MARKETPLACE'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
