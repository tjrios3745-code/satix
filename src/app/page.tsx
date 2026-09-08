"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatBox, FileAttachment } from "@/components/chat/chat-box";
import { CodeBlock } from "@/components/chat/code-block";
import { FeatureView, FeatureTab } from "@/components/features/feature-view";
import { AuthModal } from "@/components/auth/auth-modal";
import { StudioModal } from "@/components/studio/studio-modal";
import { PricingModal } from "@/components/pricing/pricing-modal";
import { PaymentSuccessModal } from "@/components/ui/payment-success-modal";
import { 
  Zap, 
  User as UserIcon, 
  Sparkles, 
  Download, 
  FileText, 
  FileCode, 
  Check,
  FileEdit,
  Code2,
  Share2,
  SearchCode,
  Crown,
  Layers,
  Wand2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: {
    name: string;
    type: string;
    previewUrl?: string;
  }[];
}

const QUICK_ACTIONS = [
  {
    icon: FileEdit,
    title: "Reescrever & Otimizar",
    desc: "Melhorar tom, clareza e ortografia de um texto",
    prompt: "Por favor, atue como um redator profissional. Reescreva e aprimore o seguinte texto tornando-o mais claro, envolvente e profissional:\n\n[Insira seu texto aqui]"
  },
  {
    icon: Share2,
    title: "Post para Redes Sociais",
    desc: "Gerar legenda cativante e hashtags para o Instagram",
    prompt: "Crie um post completo para o Instagram sobre o tema [assunto]. Inclua uma introdução que prenda a atenção, 3 pontos de valor, chamada para ação (CTA) e 8 hashtags relevantes."
  },
  {
    icon: Code2,
    title: "Programação & Código",
    desc: "Construir, explicar ou corrigir bugs em código",
    prompt: "Atue como um desenvolvedor Fullstack sênior. Me ajude a resolver o seguinte problema / construir a seguinte funcionalidade em Next.js/React:\n\n[Descreva aqui]"
  },
  {
    icon: SearchCode,
    title: "Análise de Documento / OCR",
    desc: "Resumir tópicos e extrair pontos-chave",
    prompt: "Analise o conteúdo do arquivo/texto anexo e extraia: 1) Resumo executivo em 3 frases, 2) Pontos mais importantes em tópicos, 3) Pendências ou pontos de atenção."
  }
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<FeatureTab>("chat");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();

      if (!error && data?.tier) {
        setUserTier(data.tier);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  };

  // Escuta status da autenticação e verifica parâmetros de retorno do Mercado Pago (?payment=success)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data.user;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id);
      } else {
        setUserTier("free");
      }
    });

    // Detecta feedback de pagamento na URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        setIsPaymentSuccessOpen(true);
        // Atualiza o estado do tier para PRO na interface
        setUserTier("pro");
        // Limpa a URL sem dar refresh na página
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserTier("free");
    handleNewChat();
  };

  const handleSelectTab = (tab: FeatureTab) => {
    if (tab === "projects") {
      setIsStudioOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentTab("chat");
    if (currentChatId === chatId) return;

    setCurrentChatId(chatId);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
      } else if (data) {
        setMessages(
          data.map((item) => ({
            id: item.id,
            role: item.role as "user" | "assistant",
            content: item.content,
          }))
        );
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentTab("chat");
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleExport = (format: "md" | "txt") => {
    if (messages.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    let fileContent = "";
    let fileName = `chat-satix-${timestamp}.${format}`;
    let mimeType = "text/plain;charset=utf-8";

    if (format === "md") {
      fileContent = `# Conversa SATIX - ${new Date().toLocaleString("pt-BR")}\n\n---\n\n`;
      fileContent += messages
        .map((m) => {
          const author = m.role === "user" ? "### 👤 Usuário" : "### ⚡ SATIX";
          return `${author}\n\n${m.content}\n\n---`;
        })
        .join("\n\n");
      mimeType = "text/markdown;charset=utf-8";
    } else {
      fileContent = `CONVERSA SATIX - ${new Date().toLocaleString("pt-BR")}\n\n`;
      fileContent += messages
        .map((m) => {
          const author = m.role === "user" ? "[USUÁRIO]" : "[SATIX]";
          return `${author}\n${m.content}\n\n${"-".repeat(40)}`;
        })
        .join("\n\n");
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setExportFeedback(`Exportado como .${format}!`);
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleSendMessage = async (
    text: string,
    modelId: string,
    attachments: FileAttachment[] = []
  ) => {
    let chatId = currentChatId;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      attachments: attachments.map((a) => ({
        name: a.name,
        type: a.type,
        previewUrl: a.previewUrl,
      })),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const persistChatPromise = (async () => {
      try {
        let activeId = chatId;
        if (!activeId) {
          const titleSummary = text
            ? text.slice(0, 30) + (text.length > 30 ? "..." : "")
            : `Anexo: ${attachments[0]?.name || "Arquivo"}`;

          const { data: newChat, error: chatError } = await supabase
            .from("chats")
            .insert({
              title: titleSummary,
              user_id: user?.id || null,
            })
            .select("id")
            .single();

          if (chatError) {
            console.error("Erro ao criar chat no Supabase:", chatError);
          } else if (newChat) {
            activeId = newChat.id;
            setCurrentChatId(newChat.id);
          }
        }

        if (activeId) {
          const textToSave = text || `[Enviou ${attachments.length} anexo(s)]`;
          await supabase.from("messages").insert({
            chat_id: activeId,
            role: "user",
            content: textToSave,
          });
        }
        return activeId;
      } catch (e) {
        console.error("Erro na persistência do chat:", e);
        return chatId;
      }
    })();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          agentId: activeAgentId,
          userId: user?.id || null,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          attachments: attachments.map((a) => ({
            name: a.name,
            type: a.type,
            base64: a.base64,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro na API" }));
        throw new Error(errorData.error || "Erro retornado pela API");
      }

      if (!response.body) {
        throw new Error("Resposta sem stream de dados");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: streamText } : m
          )
        );
      }

      const resolvedChatId = await persistChatPromise;
      if (resolvedChatId && streamText) {
        await supabase.from("messages").insert({
          chat_id: resolvedChatId,
          role: "assistant",
          content: streamText,
        });
      }
    } catch (err: any) {
      console.error("Erro ao processar stream:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Erro: ${err?.message || "Falha na conexão com a API."}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutPlan = async (tier: string) => {
    if (!user) {
      setIsPricingOpen(false);
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          tier: tier,
        }),
      });

      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || "Não foi possível iniciar o checkout.");
      }
    } catch (err) {
      console.error("Erro no checkout:", err);
      alert("Erro ao conectar com o gateway do Mercado Pago.");
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#06070a] overflow-hidden flex flex-col">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, #101c3d 0%, #0c1429 35%, #070a14 70%, #050608 100%)",
        }}
      />

      <Header
        user={user}
        userTier={userTier}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenPricing={() => setIsPricingOpen(true)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => handleNewChat()}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentTier={userTier}
        onSelectPlan={handleCheckoutPlan}
      />

      <PaymentSuccessModal
        isOpen={isPaymentSuccessOpen}
        onClose={() => setIsPaymentSuccessOpen(false)}
      />

      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        userId={user?.id}
        userTier={userTier}
        onRequireUpgrade={() => {
          setIsStudioOpen(false);
          setIsPricingOpen(true);
        }}
        onSendToChat={(dataUrl, promptText) => {
          const base64 = dataUrl.split(",")[1];
          const newAttachment: FileAttachment = {
            name: `studio-edit-${Date.now()}.png`,
            type: "image/png",
            previewUrl: dataUrl,
            base64: base64,
          };
          setCurrentTab("chat");
          handleSendMessage(
            promptText || "Analise a imagem editada no Studio.",
            selectedModel,
            [newAttachment]
          );
        }}
      />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar
          currentChatId={currentChatId}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />

        <main className="flex-1 flex flex-col relative w-full h-full">
          {currentTab !== "chat" ? (
            <FeatureView
              currentTab={currentTab}
              onBackToChat={() => setCurrentTab("chat")}
              activeAgentId={activeAgentId}
              onSelectActiveAgent={setActiveAgentId}
            />
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 -translate-y-2 w-full max-w-4xl mx-auto overflow-y-auto">
              
              {/* Topo / Banner de Destaque PRO */}
              <div className="w-full text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Plano {userTier.toUpperCase()} &bull; {userTier === "free" ? "Desbloqueie o PRO por R$ 29/mês" : "Benefícios Ativos"}</span>
                  </button>
                </div>

                <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-zinc-100 leading-tight mb-2">
                  O que você quer criar hoje?
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Chat multimodal inteligente, estúdio de edição visual e geração com os modelos de IA mais avançados do mundo.
                </p>
              </div>

              {/* Pilares de Diferenciais do SATIX PRO (Mini Showcase) */}
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-200">Gemini 2.5 Pro</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Raciocínio complexo</span>
                </div>

                <div 
                  onClick={() => setIsStudioOpen(true)}
                  className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer flex flex-col items-center text-center transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-200">SATIX Studio</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Recorte & Ajustes IA</span>
                </div>

                <div 
                  onClick={() => setIsPricingOpen(true)}
                  className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer flex flex-col items-center text-center transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-200">Imagen 3</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Geração fotorrealista</span>
                </div>
              </div>

              {/* Cards de Ações Rápidas */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                {QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(action.prompt, selectedModel)}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 text-left transition-all group flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {action.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 leading-snug mt-0.5 truncate">
                          {action.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="w-full flex justify-center">
                <ChatBox
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  userTier={userTier}
                  onRequireUpgrade={() => setIsPricingOpen(true)}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-[#06070a]/40 backdrop-blur-md">
                <button
                  onClick={() => setIsPricingOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Plano {userTier.toUpperCase()}</span>
                </button>

                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs transition-colors"
                    title="Exportar conversa"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#0c101d] border border-white/10 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => handleExport("md")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <span>Markdown (.md)</span>
                      </button>
                      <button
                        onClick={() => handleExport("txt")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Texto puro (.txt)</span>
                      </button>
                    </div>
                  )}

                  {exportFeedback && (
                    <div className="absolute right-0 top-full mt-2 flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs shadow-lg whitespace-nowrap z-50 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>{exportFeedback}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-4xl w-full mx-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-4 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        <Zap className="w-4 h-4 fill-emerald-400" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-white/10 text-zinc-100 border border-white/10"
                          : "bg-transparent text-zinc-200 w-full"
                      }`}
                    >
                      {m.role === "user" && m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {m.attachments.map((att, attIdx) => (
                            <div key={attIdx} className="overflow-hidden rounded-lg">
                              {att.previewUrl ? (
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="max-h-48 max-w-xs object-cover rounded-lg border border-white/10"
                                />
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-300">
                                  <FileText className="w-4 h-4 text-emerald-400" />
                                  <span className="truncate max-w-[160px]">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {m.role === "assistant" ? (
                        m.content.length === 0 ? (
                          <div className="flex items-center gap-3 py-1 text-zinc-400">
                            <div className="relative flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin [animation-duration:3s]" />
                              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping [animation-duration:2s]" />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                              <span>Pensando</span>
                              <span className="inline-flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 prose-invert [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-zinc-100 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-zinc-100 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-zinc-200 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>hr]:border-white/10 [&>hr]:my-4">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const codeContent = String(children).replace(/\n$/, "");

                                  if (!inline && match) {
                                    return (
                                      <CodeBlock
                                        language={match[1]}
                                        value={codeContent}
                                      />
                                    );
                                  }

                                  if (!inline && codeContent.includes("\n")) {
                                    return (
                                      <CodeBlock
                                        language=""
                                        value={codeContent}
                                      />
                                    );
                                  }

                                  return (
                                    <code
                                      className="bg-white/10 text-emerald-300 font-mono text-xs px-1.5 py-0.5 rounded"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        m.content && <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>

                    {m.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <UserIcon className="w-4 h-4 text-zinc-300" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-gradient-to-t from-[#06070a] via-[#06070a]/90 to-transparent flex justify-center">
                <ChatBox
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  userTier={userTier}
                  onRequireUpgrade={() => setIsPricingOpen(true)}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}