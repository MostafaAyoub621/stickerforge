
import React, { useState, useRef } from 'react';
import { gemini } from '../services/geminiService';
import { DesignStyle, ProductTarget, DesignAsset, ProjectState } from '../types';

interface AIPanelProps {
  project: ProjectState;
  onGenerate: (asset: DesignAsset) => void;
  updateProject: (updates: Partial<ProjectState>) => void;
  setLoading: (l: boolean) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ project, onGenerate, updateProject, setLoading }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isMetaLoading, setIsMetaLoading] = useState(false);
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
          const r = imageData.data[i];
          const g = imageData.data[i+1];
          const b = imageData.data[i+2];
          // If the pixel is close to white, make it transparent
          if (r > 240 && g > 240 && b > 240) {
            imageData.data[i+3] = 0;
          }
        }
        ctx?.putImageData(imageData, 0, 0);
        onGenerate({ ...project.currentAsset, url: canvas.toDataURL('image/png') });
      }
    };
    img.src = project.currentAsset.url;
  };

  const handleVectorize = async () => {
    if (!project.currentAsset) return;
    setLoading(true);
    try {
      const paths = await gemini.vectorizeImage(project.currentAsset.url);
      onGenerate({ ...project.currentAsset, vectorPaths: paths });
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleMetadata = async () => {
    if (!project.currentAsset) return;
    setIsMetaLoading(true);
    try {
      const metadata = await gemini.generateListingMetadata({
        prompt: project.currentAsset.prompt || "Concept",
        style: project.style,
        target: project.target,
        brand: project.brandName || "Design Forge"
      });
      onGenerate({ ...project.currentAsset, metadata });
    } finally { setIsMetaLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProject({ imageInput: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyTags = () => {
    if (project.currentAsset?.metadata?.tags) {
      navigator.clipboard.writeText(project.currentAsset.metadata.tags.join(', '));
      alert('50 professional SEO tags copied to clipboard!');
    }
  };

  return (
    <div className="w-80 h-full glass border-l border-slate-700 flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-10">
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-2.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Design Controller
          </h3>
          
          <div className="mb-6">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Reference Source</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest flex flex-col items-center justify-center gap-2 mb-3 group"
            >
              <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-all">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              UPLOAD REFERENCE IMAGE
            </button>
            
            {project.imageInput && (
              <div className="relative group rounded-2xl overflow-hidden border border-blue-500/30 p-2 bg-blue-500/5 animate-in fade-in zoom-in-95">
                <img src={project.imageInput} className="w-full h-32 object-contain rounded-xl shadow-lg" alt="Reference Preview" />
                <button 
                  onClick={() => updateProject({ imageInput: undefined })}
                  className="absolute top-4 right-4 bg-red-500 p-1.5 rounded-full text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800 w-full mb-8"></div>

          {project.currentAsset ? (
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Refinement Engine</label>
                <textarea 
                  value={editPrompt} 
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Make lines thicker'..."
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs h-24 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-700 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleEdit} 
                  disabled={!editPrompt}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-3 tracking-widest uppercase disabled:opacity-20 shadow-xl shadow-indigo-600/20"
                >
                   APPLY REFINEMENT
                </button>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase text-center mb-1">Background Tools</span>
                    <button 
                      onClick={handleRemoveBackground} 
                      className="w-full py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[9px] font-black hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-2 uppercase"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      1. AI CLEAR BACKGROUND
                    </button>
                    <button 
                      onClick={makeTransparent} 
                      className="w-full py-3 bg-blue-600/10 border border-blue-500/20 text-blue-300 rounded-xl text-[9px] font-black hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2 uppercase"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m0 11v1m4-8h1m-11 0h1m2-2v10" /></svg>
                      2. MAKE WHITE TRANSPARENT
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleVectorize} 
                    className="w-full py-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-[10px] font-black hover:bg-slate-700 transition-all flex items-center justify-center gap-3 uppercase shadow-lg"
                  >
                    EXTRACT VECTOR
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-700 italic text-[9px] border-2 border-dashed border-slate-800 rounded-3xl uppercase tracking-[0.3em] leading-loose">
              Forging in progress...
            </div>
          )}
        </section>

        {project.currentAsset && (
          <section className="animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                SEO HUB
              </h3>
              <button 
                onClick={handleMetadata} 
                disabled={isMetaLoading} 
                className="text-[9px] font-black text-emerald-500 uppercase hover:underline transition-all tracking-widest disabled:opacity-20"
              >
                {isMetaLoading ? 'OPTIMIZING...' : 'FORGE 50 TAGS'}
              </button>
            </div>
            {project.currentAsset.metadata && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[8px] text-slate-600 uppercase font-black mb-1">Title</p>
                  <p className="text-[11px] text-white font-bold">{project.currentAsset.metadata.title}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl relative group">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] text-slate-600 uppercase font-black">50 Pro Tags</p>
                    <button onClick={copyTags} className="text-[8px] text-emerald-400 opacity-0 group-hover:opacity-100 uppercase font-black transition-all">Copy</button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono line-clamp-2">{project.currentAsset.metadata.tags.join(', ')}</p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
