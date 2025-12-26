
import React, { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { animated, useSpring } from '@react-spring/web';
import { DesignAsset, ProductTarget, CanvasBackground, ExportFormat } from '../types';
import { MARKETPLACE_PRESETS } from '../constants';

interface CanvasProps {
  asset: DesignAsset | null;
  target: ProductTarget;
  background: CanvasBackground;
  isLoading: boolean;
  setLoading: (l: boolean) => void;
  onUpdate: (url: string) => void;
}

type CanvasViewMode = 'editor' | 'mockup' | 'vector';

const Canvas: React.FC<CanvasProps> = ({ asset, target, background, isLoading, setLoading, onUpdate }) => {
  const [viewMode, setViewMode] = useState<CanvasViewMode>('editor');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{pathIdx: number, nodeIdx: number} | null>(null);
  const [localPaths, setLocalPaths] = useState<string[]>([]);
  const [mockupScale, setMockupScale] = useState(1);
  const [mockupRotation, setMockupRotation] = useState(0);
  
  // Custom Export State
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
      onWheel: ({ delta: [, dy], active }) => {
        // Natural feeling zoom with scroll wheel
        const newZoom = Math.min(Math.max(zoom.get() - dy * 0.002, 0.1), 10);
        api.start({ zoom: newZoom, immediate: active });
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
    
    if (format === 'SVG') {
      const width = parseInt(exportWidth) || 2000;
      const height = parseInt(exportHeight) || 2000;
      
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 512 512">`;
      if (localPaths.length > 0) {
        svgContent += localPaths.map(p => `<path d="${p}" fill="black" />`).join('\n');
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
        win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${asset.url}" style="width:${exportWidth}px;height:${exportHeight}px;object-contain:contain;"/></body></html>`);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = parseInt(exportWidth) || 2000;
      canvas.height = parseInt(exportHeight) || 2000;
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

  const renderMockup = () => {
    if (!asset) return null;
    const isNoneTarget = target === ProductTarget.NONE;

    return (
      <div className="relative w-[480px] h-[480px] group cursor-pointer perspective-1000 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-full blur-[120px] transition-all duration-1000 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-110"></div>
        
        <div className={`relative w-full h-full ${isNoneTarget ? 'bg-slate-900/40 border-dashed' : 'bg-slate-900'} border border-slate-700/50 rounded-[64px] shadow-2xl flex flex-col items-center justify-center transition-all duration-700 ease-out group-hover:shadow-[0_0_100px_rgba(59,130,246,0.2)]`}
             style={{ transform: `scale(${mockupScale}) rotate(${mockupRotation}deg)` }}>
          
          <div className="relative p-12 transition-all duration-700 ease-out group-hover:scale-105">
            <div className="relative">
              <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-4/5 h-[20%] bg-black/40 blur-[40px] rounded-full group-hover:blur-[50px] transition-all"></div>
              <img 
                src={asset.url} 
                className="w-64 h-64 object-contain relative z-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-700 group-hover:drop-shadow-[0_40px_80px_rgba(59,130,246,0.3)]" 
                alt="Real-time Preview" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full mix-blend-screen opacity-50"></div>
            </div>
          </div>

          <div className="absolute bottom-12 flex flex-col items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] group-hover:text-blue-400 transition-colors">
              {isNoneTarget ? 'PRODUCTION ASSET' : target.replace('_', ' ')}
            </span>
            <div className="w-16 h-1 bg-blue-500/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center"></div>
          </div>
        </div>

        <div className="absolute -bottom-12 flex items-center gap-8 glass px-6 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
           <div className="flex flex-col gap-1">
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Mockup Scale</span>
             <input 
               type="range" min="0.6" max="1.3" step="0.01" 
               value={mockupScale} 
               onChange={(e) => setMockupScale(parseFloat(e.target.value))}
               className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
             />
           </div>
           <div className="w-px h-6 bg-slate-700/50"></div>
           <div className="flex flex-col gap-1">
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Mockup Rotation</span>
             <input 
               type="range" min="-45" max="45" step="1" 
               value={mockupRotation} 
               onChange={(e) => setMockupRotation(parseInt(e.target.value))}
               className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
             />
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

      {/* Floating dynamic zoom indicator */}
      <div className="absolute left-6 bottom-6 z-40 group/zoom">
          <div className="glass px-4 py-2 rounded-full border-white/5 flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest font-mono">
                 {(zoom.get() * 100).toFixed(0)}%
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase hidden group-hover/zoom:inline transition-all">
                  (Scroll to zoom)
              </span>
          </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
        <div className="glass px-2 py-1.5 rounded-2xl shadow-2xl border-white/5 flex items-center gap-1 backdrop-blur-3xl">
          <button onClick={() => setZoomLevel(zoom.get() * 0.8)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
          </button>
          
          <div className="w-[1px] h-4 bg-slate-700/50 mx-1"></div>
          
          {[0.5, 1, 2].map(lv => (
            <button key={lv} onClick={() => setZoomLevel(lv)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${Math.abs(zoom.get() - lv) < 0.1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
              {lv * 100}%
            </button>
          ))}
          
          <div className="w-[1px] h-4 bg-slate-700/50 mx-1"></div>
          
          <button onClick={() => setZoomLevel(zoom.get() * 1.2)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-6 glass px-6 py-3 rounded-2xl shadow-2xl border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Viewport</span>
            <animated.span className="text-white font-mono text-[11px] w-14 text-center font-bold">
              {zoom.to(v => `${(v * 100).toFixed(0)}%`)}
            </animated.span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700 opacity-50"></div>
          <button onClick={handleResetView} className="group flex items-center gap-2 text-blue-400 text-[10px] font-black tracking-widest uppercase hover:text-blue-300 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h16v16H4V4z" /></svg>
            FIT
          </button>
        </div>
      </div>

      <animated.div className="relative shadow-2xl overflow-hidden rounded-3xl" style={{ width: '512px', height: '512px', x, y, scale: zoom, ...getCanvasBgStyle() }}>
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl z-40 animate-in fade-in">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-8 text-[11px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Forging Masterpiece...</p>
          </div>
        ) : viewMode === 'mockup' ? (
          <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-700">{renderMockup()}</div>
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
