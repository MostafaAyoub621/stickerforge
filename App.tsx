
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import AIPanel from './components/AIPanel';
import LiveAssistant from './components/LiveAssistant';
import { gemini } from './services/geminiService';
import { DesignStyle, ProductTarget, DesignAsset, ProjectState, StickerMaterial, CanvasBackground, TextPosition } from './types';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    currentAsset: null,
    history: [],
    style: DesignStyle.MINIMAL,
    target: ProductTarget.STICKER,
    material: StickerMaterial.VINYL,
    background: CanvasBackground.WHITE,
    brandName: '',
    logoText: '',
    fontFamily: 'Inter',
    mergeTextWithStyle: true,
    textPosition: TextPosition.BELOW,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleUpdateAsset = (asset: DesignAsset) => {
    setProject(prev => {
      const newHistory = prev.currentAsset && prev.currentAsset.url !== asset.url 
        ? [prev.currentAsset, ...prev.history].slice(0, 12)
        : prev.history;
      return { ...prev, currentAsset: asset, history: newHistory };
    });
  };

  const handleSuggest = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const res = await gemini.suggestPrompts(prompt);
      setSuggestions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async (isMerge: boolean = false) => {
    const finalPrompt = isMerge 
      ? `Hybrid design: Combine the visual elements, composition, and layout from the uploaded reference image with the aesthetic theme and specific stylistic choices of the current design. ${prompt}`
      : prompt;

    if ((!finalPrompt && !project.imageInput) || isLoading) return;
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await gemini.generateLogo({ 
        prompt: finalPrompt, 
        style: project.style, 
        target: project.target, 
        brandName: project.brandName || "Design",
        logoText: project.logoText,
        fontFamily: project.fontFamily,
        mergeTextWithStyle: project.mergeTextWithStyle,
        textPosition: project.textPosition,
        complexity: 'balanced',
        palette: 'Vibrant',
        aspectRatio: '1:1',
        imageInput: project.imageInput // Used for design cloning
      });
      handleUpdateAsset({
        id: Math.random().toString(36).substr(2, 9),
        url: result.imageUrl,
        type: 'image',
        name: `${project.brandName || 'Design'} Asset`,
        prompt: prompt,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (type: 'generate' | 'merge') => {
    handleGenerate(type === 'merge');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 overflow-hidden relative">
      <Sidebar 
        project={project} 
        updateProject={(u) => setProject(p => ({...p, ...u}))} 
        onRevert={handleUpdateAsset} 
        prompt={prompt}
        setPrompt={setPrompt}
        onAction={handleAction}
        isLoading={isLoading}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Canvas 
          asset={project.currentAsset} 
          target={project.target} 
          background={project.background} 
          isLoading={isLoading} 
          setLoading={setIsLoading} 
          onUpdate={(url) => project.currentAsset && handleUpdateAsset({...project.currentAsset, url})} 
        />
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 z-40">
          <div className="glass p-2.5 rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.8)] border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-700">
            
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-50 transition-opacity">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate(false);
                  }
                }}
                placeholder="Describe your design vision..." 
                className="w-full bg-slate-900/60 border-none focus:ring-2 focus:ring-blue-500/20 text-sm pl-12 pr-6 py-4 h-[60px] min-h-[60px] max-h-[120px] resize-none rounded-2xl placeholder:text-slate-600 custom-scrollbar transition-all leading-relaxed"
              />
              
              {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-5 glass border-blue-500/30 rounded-3xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-4 duration-500 backdrop-blur-3xl overflow-hidden">
                   <div className="flex justify-between items-center px-3 mb-3 pb-2 border-b border-white/5">
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Design Variations</span>
                     <button onClick={() => setSuggestions([])} className="w-6 h-6 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                     </button>
                   </div>
                   <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                     {suggestions.map((s, i) => (
                       <button 
                        key={i} 
                        onClick={() => {setPrompt(s); setSuggestions([]);}} 
                        className="text-left p-3.5 rounded-xl hover:bg-blue-600/20 hover:text-blue-200 text-xs text-slate-400 transition-all border border-transparent hover:border-blue-500/30 active:scale-[0.98]"
                       >
                         {s}
                       </button>
                     ))}
                   </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pr-1">
              <button 
                onClick={handleSuggest} 
                disabled={isSuggesting || !prompt} 
                className={`p-4 rounded-2xl transition-all relative overflow-hidden group ${
                  isSuggesting ? 'bg-indigo-600/10' : 'bg-slate-800/80 hover:bg-slate-700/80 text-blue-400'
                } disabled:opacity-20`}
                title="AI Prompt Optimization"
              >
                {isSuggesting ? (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </button>

              <button 
                onClick={() => handleGenerate(false)} 
                disabled={isLoading || (!prompt && !project.imageInput)} 
                className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3 min-w-[120px] justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Forging</span>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AIPanel project={project} onGenerate={handleUpdateAsset} setLoading={setIsLoading} />
      <LiveAssistant />
    </div>
  );
};

export default App;
