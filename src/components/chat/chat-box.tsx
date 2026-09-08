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
MicOff
} from "lucide-react";

export interface FileAttachment {
name: string;
type: string;
previewUrl?: string;
base64: string;
}

export interface ChatBoxProps {
onSendMessage: (text: string, modelId: string, attachments?: FileAttachment[]) => Promise | void;
isLoading: boolean;
disabled?: boolean;
selectedModel?: string;
onSelectModel?: (modelId: string) => void;
}

const AVAILABLE_MODELS = [
{ id: "gemini-2.5-flash", name: "Flash", desc: "Rápido e balanceado" },
{ id: "gemini-2.5-flash-lite", name: "Flash Lite", desc: "Ultra veloz" },
{ id: "gemini-2.5-pro", name: "Pro", desc: "Raciocínio complexo" },
];

/

Utilitário para redimensionar e comprimir imagens antes do envio,

garantindo payload leve para contornar o limite de 4.5 MB da Vercel.
*/
async function processFile(
file: File,
maxWidth = 1600,
maxHeight = 1600,
quality = 0.8
): Promise {
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
reject(new Error("Falha ao obter contexto 2D do Canvas"));
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
onSelectModel
}: ChatBoxProps) {
const [input, setInput] = useState("");
const [attachment, setAttachment] = useState<FileAttachment | null>(null);
const [isProcessingFile, setIsProcessingFile] = useState(false);
const [internalModel, setInternalModel] = useState(AVAILABLE_MODELS[0].id);
const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
const [isListening, setIsListening] = useState(false);

const fileInputRef = useRef(null);
const textareaRef = useRef(null);
const dropdownRef = useRef(null);
const recognitionRef = useRef(null);

const activeModel = controlledModel || internalModel;

const handleModelSelect = (id: string) => {
if (onSelectModel) {
onSelectModel(id);
} else {
setInternalModel(id);
}
setIsModelDropdownOpen(false);
};

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.style.height = "auto";
textareaRef.current.style.height = ${Math.min(textareaRef.current.scrollHeight, 180)}px;
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

// Limpa o reconhecimento de voz ao desmontar o componente
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
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

if (!SpeechRecognition) {
  alert("Seu navegador não possui suporte ao reconhecimento de voz nativo. Recomendamos o Google Chrome ou Edge.");
  return;
}

try {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = true;
  recognition.interimResults = true;

  let initialText = input;

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event: any) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const separator = initialText.length > 0 && !initialText.endsWith(" ") ? " " : "";
    setInput(initialText + separator + transcript);
  };

  recognition.onerror = (event: any) => {
    console.error("Erro no reconhecimento de voz:", event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognitionRef.current = recognition;
  recognition.start();
} catch (err) {
  console.error("Falha ao iniciar reconhecimento de áudio:", err);
  setIsListening(false);
}


};

const handleFileChange = async (e: React.ChangeEvent) => {
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

const handleKeyDown = (e: React.KeyboardEvent) => {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
handleSubmit();
}
};

const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === activeModel) || AVAILABLE_MODELS[0];

return (


{attachment && (


{attachment.previewUrl ? (

) : (



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
        placeholder={isListening ? "Ouvindo sua voz em tempo real..." : "Peça ao Satix..."}
        className={`w-full bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder-zinc-500 max-h-[180px] scrollbar-thin scrollbar-thumb-white/10 ${
          isListening ? "placeholder-emerald-400/80" : ""
        }`}
      />
    </div>

    <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-white/5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,text/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Anexar Arquivo */}
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

        {/* Botão de Gravação de Voz */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          disabled={disabled || isLoading}
          title={isListening ? "Parar gravação" : "Falar com o Satix (Reconhecimento de Voz)"}
          className={`p-2 rounded-xl transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          } disabled:opacity-40`}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 text-red-400" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Seletor de Modelos */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            disabled={disabled || isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors border border-white/5"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{currentModelObj.name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-[#090d16] border border-white/10 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium text-zinc-200">{model.name}</div>
                    <div className="text-[10px] text-zinc-500">{model.desc}</div>
                  </div>
                  {activeModel === model.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Envio */}
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