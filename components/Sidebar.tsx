
import React, { useRef, useState, useEffect } from 'react';
import { STYLE_PRESETS, PRODUCT_CATEGORIES, STICKER_MATERIALS, FONT_PRESETS, TEXT_POSITIONS } from '../constants';
import { DesignStyle, ProductTarget, DesignAsset, StickerMaterial, CanvasBackground, ProjectState, TextPosition, TrendingIdea } from '../types';
import { gemini } from '../services/geminiService';

interface SidebarProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onRevert: (asset: DesignAsset) => void;
  prompt?: string;
  onAction: (type: 'generate' | 'merge') => void;
  isLoading: boolean;
  setPrompt: (p: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ project, updateProject, onRevert, prompt, onAction, isLoading, setPrompt }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [cloneMode, setCloneMode] = useState<'forge' | 'merge'>('forge');
  const [trends, setTrends] = useState<TrendingIdea[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);

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

  const handleSuggestIdentity = async () => {
    setIsSuggesting(true);
    try {
      const identity = await gemini.suggestIdentity(prompt || '', project.currentAsset?.url || project.imageInput);
      updateProject({ brandName: identity.brand, logoText: identity.tagline });
    } finally {
      setIsSuggesting(false);
    }
  };

  const loadTrends = async () => {
    setIsFetchingTrends(true);
    try {
      const fetchedTrends = await gemini.fetchTrendingIdeas();
      setTrends(fetchedTrends);
    } finally {
      setIsFetchingTrends(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  return (
    <div className="w-80 h-full glass border-r border-slate-700 flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tighter uppercase">
            StickerForge
          </h1>
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">AI Design Studio</span>
        </div>
      </div>

      <div className="space-y-10 pb-12">
        {/* POD Trends Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Market Trends</label>
            <button 
              onClick={loadTrends}
              className="text-[9px] font-black text-blue-400 hover:text-blue-300 disabled:opacity-20 uppercase transition-all"
              disabled={isFetchingTrends}
            >
              {isFetchingTrends ? 'FETCHING...' : 'REFRESH'}
            </button>
          </div>
          <div className="space-y-3">
            {trends.length > 0 ? (
              trends.map((trend, i) => (
                <button 
                  key={i}
                  onClick={() => setPrompt(trend.suggestedPrompt)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-white group-hover:text-blue-400 transition-colors">{trend.title}</span>
                    <span className="text-[7px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">HOT</span>
                  </div>
                  <p className="text-[8px] text-slate-500 line-clamp-1 italic mb-1">{trend.niche}</p>
                  <p className="text-[8px] text-slate-600 line-clamp-2 leading-tight">{trend.reason}</p>
                </button>
              ))
            ) : (
              <div className="py-4 text-center border border-dashed border-slate-800 rounded-xl">
                 <span className="text-[9px] text-slate-700 font-black uppercase">Loading trends...</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Design Identity</label>
            <button 
              onClick={handleSuggestIdentity}
              disabled={isSuggesting || (!prompt && !project.currentAsset && !project.imageInput)}
              className="text-[9px] font-black text-blue-400 hover:text-blue-300 disabled:opacity-20 uppercase transition-all flex items-center gap-1.5 group"
            >
              <svg className={`w-3 h-3 ${isSuggesting ? 'animate-spin' : 'group-hover:rotate-12'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2.5}/></svg>
              {isSuggesting ? 'THINKING' : 'AI SUGGEST'}
            </button>
          </div>
          <div className="space-y-4">
            <div className="group">
              <span className="text-[8px] text-slate-500 mb-1.5 block uppercase font-black tracking-widest group-focus-within:text-blue-500 transition-colors">Brand / Studio Name</span>
              <input 
                type="text" 
                value={project.brandName}
                onChange={(e) => updateProject({ brandName: e.target.value })}
                placeholder="e.g. Neon Nomad"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700 font-medium"
              />
            </div>
            <div className="group">
              <span className="text-[8px] text-slate-500 mb-1.5 block uppercase font-black tracking-widest group-focus-within:text-indigo-500 transition-colors">Hero Text / Tagline</span>
              <input 
                type="text" 
                value={project.logoText}
                onChange={(e) => updateProject({ logoText: e.target.value })}
                placeholder="The text on your design"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-medium"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clone Design Source</label>
            <div className="flex bg-slate-900/80 rounded-lg p-0.5 border border-slate-800/50">
              <button 
                onClick={() => setCloneMode('forge')}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${cloneMode === 'forge' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Forge
              </button>
              <button 
                onClick={() => setCloneMode('merge')}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${cloneMode === 'merge' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Merge
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-3xl flex flex-col items-center gap-3 hover:bg-blue-500/10 transition-all text-blue-400 group relative overflow-hidden"
            >
              {project.imageInput ? (
                <div className="relative w-full h-32 px-4 group">
                  <img src={project.imageInput} className="w-full h-full object-contain rounded-xl shadow-2xl" alt="Reference Source" />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl backdrop-blur-sm">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace Reference</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Clone Mode</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Upload sketch or design</span>
                  </div>
                </>
              )}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            
            {project.imageInput && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onAction(cloneMode === 'forge' ? 'generate' : 'merge')}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${cloneMode === 'forge' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white shadow-xl active:scale-95 disabled:opacity-50`}
                >
                  {isLoading ? 'WORKING...' : (cloneMode === 'forge' ? 'FORGE FROM REFERENCE' : 'MERGE WITH CURRENT')}
                </button>
                <button 
                  onClick={() => updateProject({ imageInput: undefined })}
                  className="w-full text-[9px] text-red-400/60 hover:text-red-400 uppercase font-black text-center py-2 transition-all"
                >
                  Reset Clone Source
                </button>
              </div>
            )}
          </div>
        </section>

        <section>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Canvas Backdrop</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: CanvasBackground.WHITE, icon: '⬜' },
              { id: CanvasBackground.BLACK, icon: '⬛' },
              { id: CanvasBackground.TRANSPARENT, icon: '🏁' },
              { id: CanvasBackground.DARK_GRID, icon: '🚥' },
              { id: CanvasBackground.STUDIO, icon: '📸' },
              { id: CanvasBackground.WARM_STUDIO, icon: '🌇' },
              { id: CanvasBackground.MESH, icon: '🌌' }
            ].map(bg => (
              <button 
                key={bg.id}
                onClick={() => updateProject({ background: bg.id })}
                className={`p-2 rounded-xl border text-lg transition-all ${project.background === bg.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
              >
                {bg.icon}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Aesthetic Style</label>
          <div className="grid grid-cols-2 gap-2.5">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                onClick={() => updateProject({ style: s.id })}
                className={`p-3.5 text-[10px] font-black rounded-2xl border transition-all text-center uppercase tracking-widest relative overflow-hidden group ${
                  project.style === s.id 
                    ? 'border-purple-500 bg-purple-500/10 text-purple-200 shadow-lg shadow-purple-500/10' 
                    : 'border-slate-800/50 hover:border-slate-700 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.name}
                {project.style === s.id && <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-bl-lg"></div>}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Product Target</label>
          <div className="space-y-6">
            {PRODUCT_CATEGORIES.map((category) => (
              <div key={category.name} className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-600 border-b border-slate-800/50 pb-1.5 uppercase tracking-widest">{category.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateProject({ target: p.id })}
                      className={`text-left p-3 rounded-xl border transition-all text-[10px] font-bold leading-tight ${
                        project.target === p.id 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-200 shadow-xl' 
                          : 'border-slate-800/50 hover:border-slate-700 bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {project.history.length > 0 && (
          <section className="pt-8 border-t border-white/5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Snapshot History</h3>
              <span className="text-[9px] text-slate-700 font-mono">{project.history.length}/12</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {project.history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onRevert(item)}
                  className="relative group rounded-2xl overflow-hidden border border-slate-800/50 hover:border-blue-500 aspect-square transition-all shadow-xl"
                >
                  <img src={item.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-all"></div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
