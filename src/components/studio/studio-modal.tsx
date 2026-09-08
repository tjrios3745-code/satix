"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Upload, 
  Download, 
  RotateCw, 
  RotateCcw, 
  Sliders, 
  Sun, 
  Contrast, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Scissors,
  Loader2,
  Send
} from "lucide-react";

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt?: string) => void;
}

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

export function StudioModal({ isOpen, onClose, onSendToChat }: StudioModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [rotation, setRotation] = useState<number>(0);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [promptPrompt, setPromptPrompt] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      setFilters(DEFAULT_FILTERS);
      setRotation(0);

      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        renderCanvas();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isRotatedSideways = rotation % 180 !== 0;
    canvas.width = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    canvas.height = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    if (!isComparing) {
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
    } else {
      ctx.filter = "none";
    }

    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  };

  useEffect(() => {
    if (imageSrc && originalImageRef.current) {
      renderCanvas();
    }
  }, [filters, rotation, isComparing, imageSrc]);

  // Remoção de fundo 1-clique via WebAssembly IA no cliente
  const handleRemoveBackground = async () => {
    if (!imageSrc || isRemovingBg) return;

    try {
      setIsRemovingBg(true);
      const { removeBackground } = await import("@imgly/background-removal");
      
      const blob = await removeBackground(imageSrc);
      const newUrl = URL.createObjectURL(blob);
      setImageSrc(newUrl);

      const newImg = new Image();
      newImg.onload = () => {
        originalImageRef.current = newImg;
        renderCanvas();
      };
      newImg.src = newUrl;
    } catch (error) {
      console.error("Falha ao remover fundo com IA:", error);
      alert("Não foi possível recortar o fundo desta imagem.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Download do arquivo mantendo resolução total
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `satix-studio-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Envio otimizado para a API do Chat para evitar o erro 413 da Vercel
  const handleSendResultToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSendToChat) return;

    const maxDimension = 1600;
    let targetWidth = canvas.width;
    let targetHeight = canvas.height;

    if (targetWidth > targetHeight) {
      if (targetWidth > maxDimension) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      }
    } else {
      if (targetHeight > maxDimension) {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      // Exporta em PNG comprimido leve preservando transparência
      const optimizedDataUrl = tempCanvas.toDataURL("image/png");
      onSendToChat(optimizedDataUrl, promptPrompt.trim() || undefined);
    } else {
      onSendToChat(canvas.toDataURL("image/png"), promptPrompt.trim() || undefined);
    }

    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#090d16] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                SATIX Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-normal">
                  IA & Canvas
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Edição e recorte neural integrado</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {imageSrc && (
              <>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-medium text-zinc-950 flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Imagem
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Principal */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Lado Esquerdo: Canvas com Fundo Quadriculado Transparente */}
          <div className="flex-1 bg-[#05070c] relative flex items-center justify-center p-6 overflow-auto">
            {imageSrc ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <div 
                  className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl"
                  style={{
                    backgroundImage: "linear-gradient(45deg, #111524 25%, transparent 25%), linear-gradient(-45deg, #111524 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111524 75%), linear-gradient(-45deg, transparent 75%, #111524 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px"
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[62vh] object-contain block transition-all"
                  />
                </div>

                {isRemovingBg && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 text-white">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-xs font-medium tracking-wide">Removendo fundo com IA...</span>
                  </div>
                )}

                <button
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/10 backdrop-blur-md text-xs text-zinc-200 flex items-center gap-1.5 shadow-lg select-none"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Segurar para ver original
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-medium text-zinc-200 mb-1">Selecione uma imagem</h3>
                <p className="text-xs text-zinc-500 mb-5">Suporta JPEG, PNG e WEBP em alta resolução</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-medium transition-all shadow-md"
                >
                  Carregar Foto
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Lado Direito: Painel de Controles */}
          <div className="w-full lg:w-84 bg-[#0a0f1d] border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col gap-5 overflow-y-auto">
            
            {/* Bloco de IA: Remoção de Fundo */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Ações Rápidas de IA
              </span>
              <button
                onClick={handleRemoveBackground}
                disabled={!imageSrc || isRemovingBg}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {isRemovingBg ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                <span>Remover Fundo (1 Clique)</span>
              </button>
            </div>

            {/* Orientação */}
            <div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2.5">
                Girar Imagem
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  disabled={!imageSrc}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-zinc-300 flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> -90°
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  disabled={!imageSrc}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-zinc-300 flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" /> +90°
                </button>
              </div>
            </div>

            {/* Ajustes Manuais */}
            <div className="space-y-3.5">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Luz & Tonalidade
              </span>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-zinc-500" /> Brilho</span>
                  <span>{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.brightness}
                  disabled={!imageSrc}
                  onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                  className="w-full accent-emerald-500 disabled:opacity-40 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span className="flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5 text-zinc-500" /> Contraste</span>
                  <span>{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.contrast}
                  disabled={!imageSrc}
                  onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                  className="w-full accent-emerald-500 disabled:opacity-40 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-zinc-500" /> Saturação</span>
                  <span>{filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  disabled={!imageSrc}
                  onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                  className="w-full accent-emerald-500 disabled:opacity-40 cursor-pointer"
                />
              </div>
            </div>

            {/* Filtros Prontos */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Filtros Rápidos
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, grayscale: 100 })}
                  disabled={!imageSrc}
                  className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/5 disabled:opacity-40 transition-colors"
                >
                  P&B
                </button>
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, sepia: 75, contrast: 110 })}
                  disabled={!imageSrc}
                  className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/5 disabled:opacity-40 transition-colors"
                >
                  Vintage
                </button>
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, contrast: 125, saturation: 130 })}
                  disabled={!imageSrc}
                  className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/5 disabled:opacity-40 transition-colors"
                >
                  Vívido
                </button>
                <button
                  onClick={() => setFilters({ ...DEFAULT_FILTERS, brightness: 105, contrast: 115, saturation: 90 })}
                  disabled={!imageSrc}
                  className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/5 disabled:opacity-40 transition-colors"
                >
                  Cinemático
                </button>
              </div>
            </div>

            {/* Enviar Imagem Editada para o Chat SATIX */}
            {imageSrc && onSendToChat && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                  Levar para o Chat
                </span>
                <input
                  type="text"
                  value={promptPrompt}
                  onChange={(e) => setPromptPrompt(e.target.value)}
                  placeholder="Pergunta ou instrução para a IA..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleSendResultToChat}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-zinc-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" /> Conversar sobre esta edição
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}