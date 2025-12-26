
import React, { useState } from 'react';
import { gemini } from '../services/geminiService';
import { DesignStyle, ProductTarget, DesignAsset, ProjectState } from '../types';

interface AIPanelProps {
  project: ProjectState;
  onGenerate: (asset: DesignAsset) => void;
  setLoading: (l: boolean) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ project, onGenerate, setLoading }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  const handleEdit = async () => {
    if (!project.currentAsset || !editPrompt) return;
    setLoading(true);
    try {
      const newUrl = await gemini.editLogo(project.currentAsset.url, editPrompt);
      onGenerate({ ...project.currentAsset, id: Math.random().toString(36).substr(2, 9), url: newUrl, timestamp: Date.now() });
      setEditPrompt('');
    } finally { setLoading(false); }
  };

  const handleVectorize = async () => {
    if (!project.currentAsset) return;
    setLoading(true);
    try {
      const paths = await gemini.vectorizeImage(project.currentAsset.url);
      onGenerate({ ...project.currentAsset, vectorPaths: paths });
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
            Refinement Engine
          </h3>
          {project.currentAsset ? (
            <div className="space-y-5">
              <div className="relative group">
                <textarea 
                  value={editPrompt} 
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Make it more vibrant', 'Add a metallic glow', 'Shift colors to teal'..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs h-32 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-700 transition-all font-medium leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Shift+Enter to Run</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleEdit} 
                  disabled={!editPrompt}
                  className="w-full py-4 bg-blue-600/10 border border-blue-500/20 text-blue-200 rounded-2xl text-[10px] font-black hover:bg-blue-600/20 transition-all flex items-center justify-center gap-3 tracking-widest uppercase disabled:opacity-20"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   MAGIC ITERATE
                </button>
                <button 
                  onClick={handleVectorize} 
                  className="w-full py-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 rounded-2xl text-[10px] font-black hover:bg-indigo-600/20 transition-all flex items-center justify-center gap-3 tracking-widest uppercase"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" /></svg>
                   EXTRACT VECTORS
                </button>
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
            {project.currentAsset.metadata ? (
              <div className="space-y-5">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-2">Marketplace Title</p>
                  <p className="text-xs text-white font-bold leading-relaxed">{project.currentAsset.metadata.title}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-2">SEO Description</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{project.currentAsset.metadata.description}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative group">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">SEO Keywords (50 Unique)</p>
                    <button onClick={copyTags} className="text-[9px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-all uppercase font-black tracking-tighter">Copy All</button>
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                    <p className="text-[9px] text-slate-400 font-mono leading-relaxed break-words">
                      {project.currentAsset.metadata.tags.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Ready for POD Optimization</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
