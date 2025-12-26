
import React, { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { animated, useSpring } from '@react-spring/web';
import { DesignAsset, ProductTarget, CanvasBackground, ExportFormat } from '../types';
import { MARKETPLACE_PRESETS, PRODUCT_CATEGORIES } from '../constants';

interface CanvasProps {
  asset: DesignAsset | null;
  target: ProductTarget;
  background: CanvasBackground;
  isLoading: boolean;
  setLoading: (l: boolean) => void;
  onUpdate: (url: string) => void;
  updateProject: (updates: any) => void;
}

type CanvasViewMode = 'editor' | 'mockup' | 'vector';

const Canvas: React.FC<CanvasProps> = ({ asset, target, background, isLoading, setLoading, onUpdate, updateProject }) => {
  const [viewMode, setViewMode] = useState<CanvasViewMode>('editor');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{pathIdx: number, nodeIdx: number} | null>(null);
  const [localPaths, setLocalPaths] = useState<string[]>([]);
  const [mockupScale, setMockupScale] = useState(0.85);
  const [mockupRotation, setMockupRotation] = useState(0);
  
  const [exportWidth, setExportWidth] = useState('2400');
  const [exportHeight, setExportHeight] = useState('2400');
  
  const [{ x, y, zoom }, api] = useSpring(() => ({ 
    x: 0, 
    y: 0, 
    zoom: 1,
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (asset?.vectorPaths) setLocalPaths(asset.vectorPaths);
  }, [asset?.vectorPaths]);

  const bind = useGesture(
    {
      onDrag: ({ delta: [dx, dy], active }) => {
        if (selectedNode && viewMode === 'vector') {
          const { pathIdx, nodeIdx } = selectedNode;
          setLocalPaths(prev => {
            const nextPaths = [...prev];
            const commands = nextPaths[pathIdx].split(/(?=[MLCZA])/);
            const cmd = commands[nodeIdx];
            if (cmd) {
              const type = cmd[0];
              const parts = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
              if (parts.length >= 2) {
                parts[0] += dx / zoom.get();
                parts[1] += dy / zoom.get();
                commands[nodeIdx] = `${type} ${parts.join(' ')}`;
                nextPaths[pathIdx] = commands.join(' ');
              }
            }
            return nextPaths;
          });
          return;
        }
        if (active) api.start({ x: x.get() + dx, y: y.get() + dy, immediate: true });
      },
      onPinch: ({ offset: [s], active }) => api.start({ zoom: s, immediate: active }),
      onWheel: ({ delta: [, dy], active, event }) => {
        if (event.ctrlKey || event.metaKey || viewMode === 'editor') {
            const factor = event.ctrlKey ? 0.005 : 0.002;
            const newZoom = Math.min(Math.max(zoom.get() - dy * factor, 0.1), 10);
            api.start({ zoom: newZoom, immediate: active });
        }
      }
    },
    { drag: { from: () => [x.get(), y.get()] }, pinch: { scaleBounds: { min: 0.1, max: 10 } }, wheel: { eventOptions: { passive: false } } }
  );

  const getCanvasBgStyle = () => {
    if (viewMode === 'mockup') return { backgroundColor: '#020617' };
    switch (background) {
      case CanvasBackground.TRANSPARENT: return { backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)', backgroundSize: '20px 20px', backgroundColor: '#f9fafb' };
      case CanvasBackground.BLACK: return { backgroundColor: '#000000' };
      case CanvasBackground.DARK_GRID: return { backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundColor: '#020617' };
      case CanvasBackground.STUDIO: return { background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)' };
      default: return { background: 'white' };
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!asset) return;
    const canvas = document.createElement('canvas');
    canvas.width = parseInt(exportWidth);
    canvas.height = parseInt(exportHeight);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = format === 'JPG' ? 'image/jpeg' : `image/${format.toLowerCase()}`;
        const a = document.createElement('a');
        a.href = canvas.toDataURL(mime, 0.9);
        a.download = `StickerForge_${Date.now()}.${format.toLowerCase()}`;
        a.click();
      };
      img.src = asset.url;
    }
    setShowExportMenu(false);
  };

  const renderMockupHub = () => {
    if (!asset) return <div className="p-20 text-slate-700 font-black uppercase tracking-widest text-center">Generate design to unlock mockups</div>;
    
    return (
      <div className="w-full h-full flex flex-col items-center gap-12 p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center gap-3 mt-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
               Real-Time Product Preview
            </h2>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Selected: {target.replace('_', ' ')}</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 w-full max-w-7xl">
           <div className="flex-1 glass rounded-[48px] border-white/5 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden p-12 shadow-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 opacity-50"></div>
              <div className="absolute top-10 right-10 flex flex-col gap-4 z-10">
                 <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Scale Factor</span>
                        <input type="range" min="0.2" max="1.5" step="0.01" value={mockupScale} onChange={(e) => setMockupScale(parseFloat(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg accent-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Rotation</span>
                        <input type="range" min="-45" max="45" value={mockupRotation} onChange={(e) => setMockupRotation(parseInt(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg accent-indigo-500" />
                    </div>
                 </div>
              </div>
              
              <div className="relative group transition-all duration-700 hover:scale-105" style={{ transform: `scale(${mockupScale}) rotate(${mockupRotation}deg)` }}>
                  <img src={asset.url} className="w-80 h-80 object-contain relative z-10 drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]" alt="Master" />
              </div>
           </div>
           
           <div className="w-full lg:w-96 flex flex-col gap-8">
              <div className="space-y-6">
                 {PRODUCT_CATEGORIES.map(cat => (
                   <div key={cat.name}>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 px-2">{cat.name}</span>
                      <div className="grid grid-cols-2 gap-3">
                         {cat.items.map(p => (
                            <button 
                              key={p.id}
                              onClick={() => updateProject({ target: p.id })}
                              className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${target === p.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                            >
                               <span className="text-lg">{p.icon}</span>
                               <span className="text-[9px] font-black uppercase tracking-tighter">{p.name}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div {...bind()} ref={containerRef} className="flex-1 h-full bg-[#020617] relative flex items-center justify-center overflow-hidden touch-none select-none">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
        <div className="glass p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border-white/5">
          {(['editor', 'vector', 'mockup'] as CanvasViewMode[]).map(mode => (
            <button key={mode} onClick={() => { setViewMode(mode); setSelectedNode(null); }} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-6 right-6 z-30">
        <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!asset} 
          className="glass px-6 py-3 rounded-2xl text-[10px] font-black shadow-2xl flex items-center gap-3 hover:bg-slate-800 border-white/5">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-3-3m0 0l-3 3m3-3v12" strokeWidth={2.5}/></svg>
          EXPORT DESIGN
        </button>
        {showExportMenu && (
          <div className="absolute top-full right-0 mt-4 w-64 glass rounded-3xl border-white/10 p-4 z-50 animate-in slide-in-from-top-2">
            <button onClick={() => handleExport('PNG')} className="w-full text-left p-3 rounded-xl hover:bg-slate-700/50 text-[10px] font-bold flex items-center justify-between">
              <span>Transparent PNG</span><span className="text-slate-500">.png</span>
            </button>
            <button onClick={() => handleExport('JPG')} className="w-full text-left p-3 rounded-xl hover:bg-slate-700/50 text-[10px] font-bold flex items-center justify-between">
              <span>High Quality JPG</span><span className="text-slate-500">.jpg</span>
            </button>
          </div>
        )}
      </div>

      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
          <button onClick={() => api.start({ zoom: zoom.get() * 1.2 })} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">+</button>
          <button onClick={() => api.start({ zoom: 1, x: 0, y: 0 })} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-blue-500 font-black text-[10px]">FIT</button>
          <button onClick={() => api.start({ zoom: zoom.get() * 0.8 })} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">-</button>
      </div>

      <animated.div className="relative shadow-2xl overflow-hidden rounded-3xl" style={{ width: '512px', height: '512px', x, y, scale: zoom, ...getCanvasBgStyle() }}>
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl z-40">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-8 text-[11px] font-black text-blue-400 uppercase tracking-[0.5em]">Synchronizing Assets...</p>
          </div>
        ) : viewMode === 'mockup' ? (
          <div className="w-full h-full">{renderMockupHub()}</div>
        ) : asset ? (
          <div className="w-full h-full relative">
            <img src={asset.url} className={`w-full h-full object-contain pointer-events-none transition-all duration-700 ${viewMode === 'vector' ? 'opacity-10 grayscale blur-[4px]' : 'opacity-100'}`} alt="Design" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-800/40">
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">Forge Empty</span>
          </div>
        )}
      </animated.div>
    </div>
  );
};

export default Canvas;
