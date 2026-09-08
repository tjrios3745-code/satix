"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Bot,
  Library,
  BrainCircuit,
  Plus,
  Trash2,
  Check,
  Code,
  PenTool,
  Terminal,
  Search,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export type FeatureTab = "chat" | "projects" | "agents" | "library" | "memory";

interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  icon: string;
  is_active: boolean;
  user_id?: string | null;
}

interface Memory {
  id: string;
  content: string;
  created_at: string;
}

interface FeatureViewProps {
  currentTab: FeatureTab;
  onBackToChat: () => void;
  activeAgentId: string | null;
  onSelectActiveAgent: (id: string) => void;
}

const AVAILABLE_ICONS = [
  { id: "bot", label: "Assistente", component: Bot },
  { id: "code", label: "Programação", component: Code },
  { id: "pen", label: "Redação", component: PenTool },
  { id: "terminal", label: "DevOps/Shell", component: Terminal },
  { id: "search", label: "Pesquisa", component: Search },
  { id: "brain", label: "Análise", component: BrainCircuit },
];

export function FeatureView({
  currentTab,
  onBackToChat,
  activeAgentId,
  onSelectActiveAgent,
}: FeatureViewProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [loadingMemories, setLoadingMemories] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentIcon, setNewAgentIcon] = useState("bot");

  const fetchMemories = async () => {
    setLoadingMemories(true);
    const { data } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMemories(data as Memory[]);
    setLoadingMemories(false);
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setAgents(data as Agent[]);
  };

  useEffect(() => {
    if (currentTab === "memory") fetchMemories();
    if (currentTab === "agents") fetchAgents();
  }, [currentTab]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("memories")
      .insert({
        content: newMemory.trim(),
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (data && !error) {
      setMemories((prev) => [data as Memory, ...prev]);
      setNewMemory("");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("memories").delete().eq("id", id);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentPrompt.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("agents")
      .insert({
        name: newAgentName.trim(),
        description: newAgentDesc.trim() || "Agente especializado SATIX",
        system_prompt: newAgentPrompt.trim(),
        icon: newAgentIcon,
        is_active: false,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (data && !error) {
      setAgents((prev) => [...prev, data as Agent]);
      setShowAgentModal(false);
      setNewAgentName("");
      setNewAgentDesc("");
      setNewAgentPrompt("");
      setNewAgentIcon("bot");
    }
  };

  const handleDeleteAgent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAgents((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("agents").delete().eq("id", id);
  };

  const handleSetActiveAgent = async (agent: Agent) => {
    onSelectActiveAgent(agent.id);
    await supabase.from("agents").update({ is_active: false }).neq("id", agent.id);
    await supabase.from("agents").update({ is_active: true }).eq("id", agent.id);
    setAgents((prev) =>
      prev.map((a) => ({ ...a, is_active: a.id === agent.id }))
    );
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "code":
        return <Code className="w-5 h-5 text-indigo-400" />;
      case "pen":
        return <PenTool className="w-5 h-5 text-indigo-400" />;
      case "terminal":
        return <Terminal className="w-5 h-5 text-indigo-400" />;
      case "search":
        return <Search className="w-5 h-5 text-indigo-400" />;
      case "brain":
        return <BrainCircuit className="w-5 h-5 text-indigo-400" />;
      default:
        return <Bot className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl w-full mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            {currentTab === "memory" && <BrainCircuit className="w-8 h-8 text-rose-400" />}
            {currentTab === "agents" && <Bot className="w-8 h-8 text-indigo-400" />}
            {currentTab === "projects" && <FolderKanban className="w-8 h-8 text-emerald-400" />}
            {currentTab === "library" && <Library className="w-8 h-8 text-amber-400" />}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100">
              {currentTab === "memory" && "Memória de Longo Prazo"}
              {currentTab === "agents" && "Agentes Especializados"}
              {currentTab === "projects" && "Projetos"}
              {currentTab === "library" && "Biblioteca"}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {currentTab === "memory" && "Diretrizes e preferências que são injetadas em todas as respostas da IA."}
              {currentTab === "agents" && "Crie e alterne assistentes com comportamentos e especialidades exclusivas."}
              {currentTab === "projects" && "Gerencie arquivos e contexto agrupados por projeto."}
              {currentTab === "library" && "Modelos e prompts prontos para uso rápido."}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToChat}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
        >
          Voltar ao Chat
        </button>
      </div>

      {currentTab === "memory" && (
        <div className="mt-6 flex flex-col gap-6">
          <form onSubmit={handleAddMemory} className="flex gap-2">
            <input
              type="text"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder="Ex: Sempre forneça respostas completas e em português..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-rose-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 font-medium text-xs shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Gravar Memória</span>
            </button>
          </form>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Memórias Ativas ({memories.length})
            </span>

            {loadingMemories ? (
              <div className="text-xs text-zinc-500 py-4 animate-pulse">Carregando memórias...</div>
            ) : memories.length === 0 ? (
              <div className="text-xs text-zinc-500 py-4 italic">Nenhuma memória adicionada ainda.</div>
            ) : (
              memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#0c101d]/60 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <p className="text-sm text-zinc-200 leading-relaxed pr-4">{m.content}</p>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="Remover memória"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentTab === "agents" && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-medium text-xs shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const isSelected = activeAgentId ? agent.id === activeAgentId : agent.is_active;
              return (
                <div
                  key={agent.id}
                  onClick={() => handleSetActiveAgent(agent)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      : "bg-[#0c101d]/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renderIcon(agent.icon)}
                        <h3 className="text-base font-semibold text-zinc-100">{agent.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            <Check className="w-3 h-3" /> Ativo
                          </span>
                        )}
                        {agent.user_id && (
                          <button
                            onClick={(e) => handleDeleteAgent(e, agent.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Excluir agente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">{agent.description}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-zinc-400 font-mono truncate">
                    {agent.system_prompt}
                  </div>
                </div>
              );
            })}
          </div>

          {showAgentModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateAgent}
                className="bg-[#0e1320] border border-white/10 rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-zinc-100">Criar Novo Agente Especialista</h3>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nome do Agente</label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Ex: Auditor de Redes & Segurança"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Ícone do Agente</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLEICONS.map((ico) => {
                      const IconComp = ico.component;
                      const isChosen = newAgentIcon === ico.id;
                      return (
                        <button
                          key={ico.id}
                          type="button"
                          onClick={() => setNewAgentIcon(ico.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors ${
                            isChosen
                              ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{ico.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                  <input
                    type="text"
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    placeholder="Ex: Analisa configurações e protocolos de rede"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Prompt de Instrução do Sistema</label>
                  <textarea
                    rows={4}
                    required
                    value={newAgentPrompt}
                    onChange={(e) => setNewAgentPrompt(e.target.value)}
                    placeholder="Ex: Você é um especialista sênior em infraestrutura e redes..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAgentModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-medium text-xs shadow-lg"
                  >
                    Salvar Agente
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {(currentTab === "projects" || currentTab === "library") && (
        <div className="mt-8 p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <Sparkles className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300">Área de {currentTab === "projects" ? "Projetos" : "Biblioteca"}</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Seus arquivos, agentes ativos e memórias permanentes já estão integrados nas conversas.
          </p>
        </div>
      )}
    </div>
  );
}

const AVAILABLEICONS = AVAILABLE_ICONS;