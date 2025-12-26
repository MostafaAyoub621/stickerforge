
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
  const [mockupScale, setMockupScale] = useState(1);
  const [mockupRotation, setMockupRotation] = useState(0);
  
  const [exportWidth, setExportWidth] = useState('2000');
  const [exportHeight, setExportHeight] = useState('2000');
  
  const [{ x, y, zoom }, api] = useSpring(() => ({ 
    x: 0, 
    y: 0, 
    zoom: 1,
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (asset?.vectorPaths) {
      setLocalPaths(asset.vectorPaths);
    }
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

        if (active) {
          api.start({ x: x.get() + dx, y: y.get() + dy, immediate: true });
        }
      },
      onPinch: ({ offset: [s], active }) => {
        api.start({ zoom: s, immediate: active });
      },
      onWheel: ({ delta: [, dy], active, event }) => {
        if (event.ctrlKey || event.metaKey || viewMode === 'editor' || viewMode === 'vector') {
            const factor = event.ctrlKey ? 0.005 : 0.002;
            const newZoom = Math.min(Math.max(zoom.get() - dy * factor, 0.1), 10);
            api.start({ zoom: newZoom, immediate: active });
        }
      }
    },
    { 
      drag: { from: () => [x.get(), y.get()] }, 
      pinch: { scaleBounds: { min: 0.1, max: 10 } },
      wheel: { eventOptions: { passive: false } }
    }
  );

  const setZoomLevel = (level: number) => {
    api.start({ zoom: level, x: 0, y: 0, immediate: false });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setSelectedNode(null);
  };

  const getCanvasBgStyle = () => {
    if (viewMode === 'mockup') return { backgroundColor: '#0f172a' };
    switch (background) {
      case CanvasBackground.TRANSPARENT:
        return { 
          backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
          backgroundSize: '20px 20px',
          backgroundColor: '#f9fafb'
        };
      case CanvasBackground.BLACK: return { backgroundColor: '#000000' };
      case CanvasBackground.DARK_GRID:
        return { 
          backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundColor: '#020617'
        };
      case CanvasBackground.STUDIO: return { background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)' };
      case CanvasBackground.WARM_STUDIO: return { background: 'radial-gradient(circle at 50% 50%, #451a03 0%, #0c0a09 100%)' };
      case CanvasBackground.MESH: return { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' };
      default: return { background: 'white' };
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!asset) return;
    const width = parseInt(exportWidth) || 2000;
    const height = parseInt(exportHeight) || 2000;
    
    if (format === 'SVG') {
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 512 512">`;
      if (localPaths.length > 0) {
        svgContent += localPaths.map(p => `<path d="${p}" fill="black" stroke="none" />`).join('\n');
      } else {
        svgContent += `<image href="${asset.url}" x="0" y="0" width="512" height="512" />`;
      }
      svgContent += `</svg>`;
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name || 'design'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'PDF') {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${asset.url}" style="width:${width}px;height:${height}px;object-fit:contain;"/></body></html>`);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const mime = format === 'JPG' ? 'image/jpeg' : `image/${format.toLowerCase()}`;
          const quality = format === 'JPG' ? 0.9 : 1.0;
          const dataUrl = canvas.toDataURL(mime, quality);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${asset.name || 'design'}_${canvas.width}x${canvas.height}.${format.toLowerCase()}`;
          a.click();
        };
        img.src = asset.url;
      }
    }
    setShowExportMenu(false);
  };

  const simplifyPaths = () => {
    setLocalPaths(prev => prev.map(p => {
        const commands = p.split(/(?=[MLCZA])/);
        return commands.filter((_, i) => i === 0 || i % 2 === 0).join(' ');
    }));
  };

  const mergeNodes = () => {
    if (!selectedNode) return;
    setLocalPaths(prev => {
        const next = [...prev];
        const cmds = next[selectedNode.pathIdx].split(/(?=[MLCZA])/);
        if (cmds.length > 2) {
            cmds.splice(selectedNode.nodeIdx, 1);
            next[selectedNode.pathIdx] = cmds.join(' ');
        }
        return next;
    });
    setSelectedNode(null);
  };

  const renderMockupHub = () => {
    if (!asset) return (
        <div className="w-full h-full flex items-center justify-center text-slate-700 uppercase font-black tracking-widest text-sm">
            Generate a design first to see mockups
        </div>
    );
    return (
      <div className="w-full h-full flex flex-col items-center gap-8 p-12 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
               <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               Real-Time Mockup Hub
            </h2>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">Design updates instantly reflect below</span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
           {PRODUCT_CATEGORIES.flatMap(cat => cat.items).filter(p => p.id !== ProductTarget.NONE).map(p => (
              <button 
                key={p.id}
                onClick={() => updateProject({ target: p.id })}
                className={`relative group rounded-3xl overflow-hidden aspect-square border-2 transition-all duration-500 ${target === p.id ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-800 hover:border-slate-600'}`}
              >
                 <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-40"></div>
                        <img 
                            src={asset.url} 
                            className={`w-32 h-32 object-contain relative z-10 transition-all duration-700 drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${target === p.id ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}
                            alt={p.name}
                        />
                        <div className="absolute inset-0 bg-white/5 opacity-10 blur-xl scale-125"></div>
                    </div>
                 </div>
                 <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{p.name}</span>
                 </div>
              </button>
           ))}
        </div>
        
        <div className="mt-12 p-10 glass rounded-[48px] border-white/5 w-full max-w-4xl flex flex-col items-center shadow-3xl">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Focused Selection: {target.replace('_', ' ')}</span>
            <div className="relative group/master transition-transform duration-700 hover:scale-105"
                 style={{ transform: `scale(${mockupScale}) rotate(${mockupRotation}deg)` }}>
                <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full group-hover/master:bg-blue-500/15 transition-all"></div>
                <img 
                    src={asset.url} 
                    className="w-72 h-72 object-contain relative z-10 drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
                    alt="Master Preview"
                />
            </div>
            
            <div className="flex gap-8 mt-12 bg-slate-900/80 px-8 py-4 rounded-3xl border border-white/5 backdrop-blur-3xl">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Size Scale</span>
                    <input type="range" min="0.5" max="1.5" step="0.01" value={mockupScale} onChange={(e) => setMockupScale(parseFloat(e.target.value))} className="w-32 h-1 bg-slate-800 rounded-lg accent-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Rotation</span>
                    <input type="range" min="-180" max="180" value={mockupRotation} onChange={(e) => setMockupRotation(parseInt(e.target.value))} className="w-32 h-1 bg-slate-800 rounded-lg accent-indigo-500" />
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div {...bind()} ref={containerRef} className="flex-1 h-full bg-[#020617] relative flex items-center justify-center overflow-hidden touch-none select-none">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
        <div className="glass p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border-white/5 backdrop-blur-3xl">
          {(['editor', 'vector', 'mockup'] as CanvasViewMode[]).map(mode => (
            <button key={mode} onClick={() => { setViewMode(mode); setSelectedNode(null); }} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                viewMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-6 right-6 z-30">
        <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!asset} 
          className="glass px-6 py-3 rounded-2xl text-[10px] font-black shadow-2xl flex items-center gap-3 hover:bg-slate-800 border-white/5 transition-all active:scale-95 disabled:opacity-30">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-3-3m0 0l-3 3m3-3v12" /></svg>
          EXPORT ASSET
        </button>
        {showExportMenu && (
          <div className="absolute top-full right-0 mt-4 w-72 glass rounded-3xl border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.8)] p-4 z-50 animate-in slide-in-from-top-2 backdrop-blur-3xl">
            <div className="mb-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Custom Dimensions (px)</span>
              <div className="flex gap-2">
                <input 
                  type="number" value={exportWidth} onChange={e => setExportWidth(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Width"
                />
                <span className="text-slate-600 self-center">×</span>
                <input 
                  type="number" value={exportHeight} onChange={e => setExportHeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Height"
                />
              </div>
            </div>
            
            <div className="px-1 py-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 mb-2">Standard Formats</div>
            <button onClick={() => handleExport('PNG')} className="w-full text-left p-3 rounded-xl hover:bg-slate-700/50 text-[10px] font-bold flex items-center justify-between group transition-all">
              <span className="text-slate-200">Hi-Res PNG</span>
              <span className="text-slate-500 font-mono">.png</span>
            </button>
            <button onClick={() => handleExport('SVG')} className="w-full text-left p-3 rounded-xl hover:bg-blue-600/20 text-[10px] font-bold flex items-center justify-between group transition-all">
              <span className="text-blue-200">SVG Vector</span>
              <span className="text-blue-500/50 font-mono">.svg</span>
            </button>
            <button onClick={() => handleExport('JPG')} className="w-full text-left p-3 rounded-xl hover:bg-slate-700/50 text-[10px] font-bold flex items-center justify-between group transition-all">
              <span className="text-slate-200">JPG Render</span>
              <span className="text-slate-500 font-mono">.jpg</span>
            </button>
            <div className="px-1 py-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 my-2">Marketplace Presets</div>
            {MARKETPLACE_PRESETS.map(preset => (
              <button key={preset.id} onClick={() => { setExportWidth(preset.dims.split('x')[0]); handleExport(preset.id as any); }} className="w-full text-left p-3 rounded-xl hover:bg-indigo-600/20 text-[10px] font-bold flex flex-col group transition-all">
                <div className="flex justify-between w-full">
                  <span className="text-indigo-200">{preset.name}</span>
                  <span className="text-indigo-500/50 font-mono text-[8px]">{preset.dims}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40 animate-in slide-in-from-left-10">
          <button onClick={() => setZoomLevel(zoom.get() * 1.25)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl active:scale-90 border-white/10" title="Zoom In"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></button>
          <button onClick={() => handleResetView()} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-blue-500 hover:text-blue-400 transition-all shadow-2xl active:scale-90 border-white/10 font-black text-[10px]" title="Reset View">FIT</button>
          <button onClick={() => setZoomLevel(zoom.get() * 0.75)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-2xl active:scale-90 border-white/10" title="Zoom Out"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg></button>
          <div className="h-px w-8 bg-slate-800 mx-auto"></div>
          <div className="glass px-2 py-4 rounded-full flex flex-col items-center gap-2 border-white/10 shadow-2xl">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-500 vertical-text origin-center -rotate-90 py-4">{(zoom.get() * 100).toFixed(0)}%</span>
          </div>
      </div>

      {viewMode === 'vector' && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40 animate-in slide-in-from-right-10">
           <button onClick={simplifyPaths} className="glass p-4 rounded-2xl text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-all shadow-2xl flex flex-col items-center gap-1.5" title="Simplify Path">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             <span className="text-[8px] font-black uppercase tracking-widest">Simplify</span>
           </button>
           <button onClick={mergeNodes} disabled={!selectedNode} className="glass p-4 rounded-2xl text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-400 transition-all shadow-2xl flex flex-col items-center gap-1.5 disabled:opacity-30" title="Merge Selected Node">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             <span className="text-[8px] font-black uppercase tracking-widest">Merge</span>
           </button>
           <div className="h-px bg-slate-800 w-10 mx-auto"></div>
           <div className="flex flex-col gap-2">
               <button className="glass p-3 rounded-xl text-slate-500 hover:text-white transition-all opacity-50 cursor-not-allowed group relative" title="Union (Coming Soon)">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                 <span className="absolute right-full mr-2 bg-black px-2 py-1 rounded text-[8px] opacity-0 group-hover:opacity-100 whitespace-nowrap">Boolean Union</span>
               </button>
               <button className="glass p-3 rounded-xl text-slate-500 hover:text-white transition-all opacity-50 cursor-not-allowed group relative" title="Subtract (Coming Soon)">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
               </button>
           </div>
        </div>
      )}

      <animated.div className="relative shadow-2xl overflow-hidden rounded-3xl" style={{ width: '512px', height: '512px', x, y, scale: zoom, ...getCanvasBgStyle() }}>
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl z-40 animate-in fade-in">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-8 text-[11px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Forging Masterpiece...</p>
          </div>
        ) : viewMode === 'mockup' ? (
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-700">{renderMockupHub()}</div>
        ) : asset ? (
          <div className="w-full h-full relative">
            <img src={asset.url} className={`w-full h-full object-contain pointer-events-none transition-all duration-700 ${viewMode === 'vector' ? 'opacity-10 grayscale blur-[4px] scale-[1.1]' : 'opacity-100'}`} alt="Design" />
            {viewMode === 'vector' && (
              <svg className="absolute inset-0 w-full h-full z-20 cursor-crosshair" viewBox="0 0 512 512">
                {localPaths.map((path, pIdx) => (
                  <g key={pIdx}>
                    <path d={path} fill="rgba(99, 102, 241, 0.05)" stroke="#6366f1" strokeWidth="2.5" className="animate-in fade-in" />
                    {path.split(/(?=[MLCZA])/).map((cmd, nIdx) => {
                      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
                      if (isNaN(coords[0])) return null;
                      const isSelected = selectedNode?.pathIdx === pIdx && selectedNode?.nodeIdx === nIdx;
                      return <circle key={nIdx} cx={coords[0]} cy={coords[1]} r={isSelected ? 7 : 5} fill={isSelected ? "white" : "#6366f1"} stroke="white" strokeWidth={isSelected ? 3 : 1.5} className="transition-all cursor-pointer hover:scale-125" onMouseDown={(e) => { e.stopPropagation(); setSelectedNode({pathIdx: pIdx, nodeIdx: nIdx}); }} />;
                    })}
                  </g>
                ))}
              </svg>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-800/40">
             <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" strokeWidth={1.5}/></svg>
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">Canvas Empty</span>
          </div>
        )}
      </animated.div>
    </div>
  );
};

export default Canvas;
