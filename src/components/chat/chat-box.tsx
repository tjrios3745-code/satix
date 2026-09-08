"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  ChevronDown,
  Sparkles,
  Zap,
  Check,
  X,
  FileText,
} from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  speed: "Ultra-rápido" | "Equilibrado" | "Avançado";
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Flash Lite",
    tag: "3.1 Lite",
    speed: "Ultra-rápido",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Flash 2.5 Lite",
    tag: "2.5 Lite",
    speed: "Ultra-rápido",
  },
  {
    id: "gemini-3.5-flash",
    name: "Flash 3.5",
    tag: "3.5 Flash",
    speed: "Equilibrado",
  },
  {
    id: "gemini-3.6-flash",
    name: "Flash 3.6",
    tag: "3.6 Flash",
    speed: "Avançado",
  },
];

export interface FileAttachment {
  name: string;
  type: string;
  base64: string;
  previewUrl?: string;
}

interface ChatBoxProps {
  onSendMessage: (text: string, modelId: string, attachments: FileAttachment[]) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ChatBox({
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
}: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isText =
        file.type.startsWith("text/") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".txt");

      if (!isImage && !isPdf && !isText) {
        alert(`O formato do arquivo "${file.name}" não é suportado. Use imagens, PDF ou arquivos de texto.`);
        continue;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Separa o cabeçalho data:mime/type;base64, da string pura
          const base64Content = result.split(",")[1] || "";
          resolve(base64Content);
        };
      });

      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      newAttachments.push({
        name: file.name,
        type: file.type || (file.name.endsWith(".md") ? "text/markdown" : "text/plain"),
        base64,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reseta o input de arquivo para permitir reenviar o mesmo arquivo se quiser
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    onSendMessage(input.trim(), selectedModel, attachments);
    setInput("");
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  return (
    <div className="w-full max-w-3xl relative">
      <div className="relative rounded-2xl bg-[#0e1320]/80 backdrop-blur-xl border border-white/10 shadow-2xl focus-within:border-white/20 transition-all flex flex-col">
        {/* Pré-visualização de Anexos */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 p-3 pb-0 overflow-x-auto scrollbar-none">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 max-w-xs flex-shrink-0"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-7 h-7 object-cover rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <span className="truncate max-w-[120px] text-zinc-200">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                  title="Remover anexo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Campo de Texto */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            attachments.length > 0
              ? "Faça uma pergunta ou comando sobre o(s) arquivo(s)..."
              : "Peça ao Satix..."
          }
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none scrollbar-none leading-relaxed"
        />

        {/* Input Oculto de Arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Ações da Esquerda */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              title="Anexar arquivos (Imagens, PDFs, TXT)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Dropdown de Modelo */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentModel.name}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl bg-[#0c101d] border border-white/10 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Modelo de IA
                  </div>
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(model.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-400 font-medium"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="flex items-center gap-1.5">
                            {model.name}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-400">
                              {model.tag}
                            </span>
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {model.speed}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={`p-2 rounded-xl transition-all pointer-events-auto ${
              (input.trim() || attachments.length > 0) && !isLoading
                ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-white/5 text-zinc-500 cursor-not-allowed"
            }`}
            title="Enviar mensagem"
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}