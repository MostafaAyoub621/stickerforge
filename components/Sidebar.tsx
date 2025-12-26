
import React, { useRef, useState, useEffect } from 'react';
import { STYLE_PRESETS, PRODUCT_CATEGORIES, FONT_PRESETS, TEXT_POSITIONS } from '../constants';
import { DesignStyle, ProductTarget, DesignAsset, CanvasBackground, ProjectState, TextPosition, TrendingIdea, PODPlatform } from '../types';
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
  const [isFontSuggesting, setIsFontSuggesting] = useState(false);
  const [cloneMode, setCloneMode] = useState<'forge' | 'merge'>('forge');
  const [trends, setTrends] = useState<TrendingIdea[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');

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

  const handleSuggestFont = async () => {
    setIsFontSuggesting(true);
    try {
      const font = await gemini.suggestFont(prompt || 'modern design');
      updateProject({ fontFamily: font });
    } finally {
      setIsFontSuggesting(false);
    }
  };

  const loadTrends = async () => {
    setIsFetchingTrends(true);
    try {
      const activePlatform = project.connectedPlatforms.find(p => p.id === project.activePlatformId);
      const fetchedTrends = await gemini.fetchTrendingIdeas(activePlatform?.name);
      setTrends(fetchedTrends);
    } finally {
      setIsFetchingTrends(false);
    }
  };

  const addCustomSite = () => {
    if (!newSiteName.trim()) return;
    const newPlatform: PODPlatform = {
      id: Math.random().toString(36).substring(7),
      name: newSiteName,
      connected: true,
      isCustom: true
    };
    updateProject({ 
      connectedPlatforms: [...project.connectedPlatforms, newPlatform],
      activePlatformId: newPlatform.id 
    });
    setNewSiteName('');
  };

  const removePlatform = (id: string) => {
    const nextPlatforms = project.connectedPlatforms.filter(p => p.id !== id);
    updateProject({ 
      connectedPlatforms: nextPlatforms,
      activePlatformId: nextPlatforms[0]?.id || 'none'
    });
  };

  useEffect(() => {
    loadTrends();
  }, [project.activePlatformId]);

  return (
    <div className="w-80 h-full glass border-r border-slate-700 flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tighter uppercase">
            StickerForge
          </h1>
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">Pro Designer</span>
        </div>
      </div>

      <div className="space-y-10 pb-12">
        {/* POD Integration Section */}
        <section className="bg-slate-900/40 p-4 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">POD Ecosystem</label>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${project.activePlatformId !== 'none' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <span className="text-[8px] font-black text-slate-500 uppercase">Live</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <select 
                value={project.activePlatformId}
                onChange={(e) => updateProject({ activePlatformId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="none">Marketplace: Select Platform</option>
                {project.connectedPlatforms.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="Add custom store..."
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-300 outline-none"
                />
                <button 
                  onClick={addCustomSite}
                  className="p-2 bg-blue-600 rounded-xl hover:bg-blue-500 text-white transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
                </button>
              </div>
            </div>

            {project.activePlatformId !== 'none' && (
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Trending Niches</span>
                  <button onClick={loadTrends} disabled={isFetchingTrends} className="text-[8px] font-black text-slate-500 hover:text-white uppercase transition-all">
                    {isFetchingTrends ? 'Searching...' : 'Search Top 10'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {trends.map((t, i) => (
                    <button 
                      key={i}
                      onClick={() => setPrompt(t.suggestedPrompt)}
                      className="text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-200 group-hover:text-blue-400">{t.title}</span>
                        <span className="text-[7px] text-emerald-500 font-black">TOP {i+1}</span>
                      </div>
                      <p className="text-[8px] text-slate-600 line-clamp-1">{t.reason}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Project Identity & Typography */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identity & Type</label>
            <div className="flex gap-2">
              <button 
                onClick={handleSuggestIdentity}
                disabled={isSuggesting || (!prompt && !project.currentAsset)}
                className="text-[9px] font-black text-blue-400 hover:text-blue-300 disabled:opacity-20 uppercase transition-all"
              >
                {isSuggesting ? 'Thinking...' : 'AI Identity'}
              </button>
              <button 
                onClick={handleSuggestFont}
                disabled={isFontSuggesting || !prompt}
                className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 disabled:opacity-20 uppercase transition-all"
              >
                {isFontSuggesting ? '...' : 'Suggest Font'}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              value={project.brandName}
              onChange={(e) => updateProject({ brandName: e.target.value })}
              placeholder="Brand/Studio Name"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-700 font-bold"
            />
            <input 
              type="text" 
              value={project.logoText}
              onChange={(e) => updateProject({ logoText: e.target.value })}
              placeholder="Primary Logo Text"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700 font-bold"
            />
            
            <div className="flex flex-col gap-3 p-3.5 bg-slate-900/30 rounded-2xl border border-white/5">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Text Positioning</span>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_POSITIONS.map(pos => (
                  <button 
                    key={pos.id}
                    onClick={() => updateProject({ textPosition: pos.id })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${project.textPosition === pos.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                  >
                    <span className="text-sm">{pos.icon}</span>
                    <span className="text-[7px] font-black uppercase tracking-tighter">{pos.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Font Family</span>
                <select 
                   value={project.fontFamily}
                   onChange={(e) => updateProject({ fontFamily: e.target.value })}
                   className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                   {FONT_PRESETS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Hex Color</span>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={project.textColor} 
                    onChange={(e) => updateProject({ textColor: e.target.value })}
                    className="w-8 h-8 bg-transparent border-none rounded-lg cursor-pointer p-0 overflow-hidden"
                  />
                  <input 
                    type="text" 
                    value={project.textColor}
                    onChange={(e) => updateProject({ textColor: e.target.value })}
                    className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-2 text-[10px] font-mono text-slate-300 uppercase outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clone Source Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clone & Clone</label>
            <div className="flex bg-slate-900/80 rounded-lg p-0.5 border border-slate-800/50">
              <button 
                onClick={() => setCloneMode('forge')}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${cloneMode === 'forge' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Style Match
              </button>
              <button 
                onClick={() => setCloneMode('merge')}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${cloneMode === 'merge' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Asset Hybrid
              </button>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-3xl flex flex-col items-center gap-3 hover:bg-blue-500/10 transition-all text-blue-400 group relative overflow-hidden"
          >
            {project.imageInput ? (
              <div className="relative w-full h-32 px-4">
                <img src={project.imageInput} className="w-full h-full object-contain rounded-xl shadow-2xl" alt="Reference Source" />
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace Reference</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Source Design</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Analyze & Clone</span>
                </div>
              </>
            )}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          
          {project.imageInput && (
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => onAction(cloneMode === 'forge' ? 'generate' : 'merge')}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${cloneMode === 'forge' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white shadow-xl active:scale-95 disabled:opacity-50`}
              >
                {isLoading ? 'WORKING...' : (cloneMode === 'forge' ? 'CLONE STYLE' : 'HYBRIDIZE')}
              </button>
              <button onClick={() => updateProject({ imageInput: undefined })} className="p-3 bg-red-600/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
              </button>
            </div>
          )}
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
              </button>
            ))}
          </div>
        </section>

        {project.history.length > 0 && (
          <section className="pt-8 border-t border-white/5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Design Snapshots</h3>
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
