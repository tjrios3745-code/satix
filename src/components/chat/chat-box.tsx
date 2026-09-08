"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  Sparkles, 
  FileText, 
  Check, 
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  Lock
} from "lucide-react";

export interface FileAttachment {
  name: string;
  type: string;
  previewUrl?: string;
  base64: string;
}

export interface ChatBoxProps {
  onSendMessage: (text: string, modelId: string, attachments?: FileAttachment[]) => Promise<void> | void;
  isLoading: boolean;
  disabled?: boolean;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  userTier?: string;
  onRequireUpgrade?: () => void;
}

const AVAILABLE_MODELS = [
  { id: "gemini-3.6-flash", name: "Flash", desc: "Rápido e balanceado", isPro: false },
  { id: "gemini-3.6-flash-lite", name: "Flash Lite", desc: "Ultra veloz", isPro: false },
  { id: "gemini-2.5-pro", name: "Pro", desc: "Raciocínio complexo", isPro: true },
];

async function processFile(
  file: File, 
  maxWidth = 1600, 
  maxHeight = 1600, 
  quality = 0.8
): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve({
          name: file.name,
          type: file.type || "application/octet-stream",
          previewUrl: undefined,
          base64: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Falha ao obter contexto Canvas 2D"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1];

      resolve({
        name: file.name,
        type: "image/jpeg",
        previewUrl: dataUrl,
        base64: base64,
      });
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatBox({ 
  onSendMessage, 
  isLoading, 
  disabled = false,
  selectedModel: controlledModel,
  onSelectModel,
  userTier = "free",
  onRequireUpgrade
}: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [internalModel, setInternalModel] = useState(AVAILABLE_MODELS[0].id);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isProOrBusiness = userTier === "pro" || userTier === "business";
  const activeModel = controlledModel || internalModel;

  const handleModelSelect = (modelObj: (typeof AVAILABLE_MODELS)[0]) => {
    if (modelObj.isPro && !isProOrBusiness) {
      setIsModelDropdownOpen(false);
      onRequireUpgrade?.();
      return;
    }

    if (onSelectModel) {
      onSelectModel(modelObj.id);
    } else {
      setInternalModel(modelObj.id);
    }
    setIsModelDropdownOpen(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz nativo.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => {
          const separator = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
          return prev + separator + transcript;
        });
      };

      recognition.onerror = (event: any) => {
        console.error("Erro no microfone:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Erro ao iniciar microfone:", err);
      setIsListening(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      const processed = await processFile(file);
      setAttachment(processed);
    } catch (err) {
      console.error("Erro ao processar anexo:", err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading || isProcessingFile || disabled) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const messageText = input.trim();
    const attachmentsList = attachment ? [attachment] : undefined;

    setInput("");
    setAttachment(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await onSendMessage(messageText, activeModel, attachmentsList);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === activeModel) || AVAILABLE_MODELS[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className={`relative rounded-2xl bg-[#0d121f]/90 border backdrop-blur-md shadow-2xl transition-all ${
        isListening ? "border-red-500/50 ring-2 ring-red-500/20" : "border-white/10 focus-within:border-emerald-500/40"
      }`}>
        {attachment && (
          <div className="p-3 pb-0 flex items-center gap-2">
            <div className="relative group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 max-w-xs">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="w-9 h-9 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
              )}

              <div className="flex flex-col min-w-0 pr-4">
                <span className="text-xs text-zinc-200 truncate font-medium">{attachment.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase">{attachment.type.split("/")[1] || "DOC"}</span>
              </div>

              <button
                type="button"
                onClick={removeAttachment}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={isListening ? "Ouvindo... pode falar" : "Peça ao Satix..."}
            className="w-full bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder-zinc-500 max-h-[180px] scrollbar-thin scrollbar-thumb-white/10"
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,text/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading || isProcessingFile}
              title="Anexar arquivo ou imagem"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              {isProcessingFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={disabled || isLoading}
              title={isListening ? "Parar gravação de voz" : "Falar por áudio"}
              className={`p-2 rounded-xl transition-all ${
                isListening 
                  ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Dropdown de Modelos */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                disabled={disabled || isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors border border-white/5"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{currentModelObj.name}</span>
                {currentModelObj.isPro && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    PRO
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl bg-[#090d16] border border-white/10 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95">
                  {AVAILABLE_MODELS.map((model) => {
                    const isLocked = model.isPro && !isProOrBusiness;

                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleModelSelect(model)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isLocked ? "opacity-75 hover:bg-emerald-500/5" : "hover:bg-white/5"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                            <span>{model.name}</span>
                            {model.isPro && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                PRO
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500">{model.desc}</div>
                        </div>

                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          activeModel === model.id && <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={(!input.trim() && !attachment) || isLoading || isProcessingFile || disabled}
            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 text-zinc-950 disabled:text-zinc-600 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}