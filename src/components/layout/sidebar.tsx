"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MessageSquare,
  FolderKanban,
  Bot,
  Library,
  BrainCircuit,
  Settings,
  Plus,
  Trash2
} from "lucide-react";
import { FeatureTab } from "@/components/features/feature-view";
import { supabase } from "@/lib/supabase";

interface ChatItem {
  id: string;
  title: string;
}

interface SidebarProps {
  currentChatId: string | null;
  currentTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar({
  currentChatId,
  currentTab,
  onSelectTab,
  onSelectChat,
  onNewChat,
  onOpenSettings,
}: SidebarProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chats")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setChats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de chats:", err);
    }
  };

  useEffect(() => {
    fetchChats();

    const channel = supabase
      .channel("public:chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o chat ao clicar no botão de excluir

    if (!confirm("Deseja realmente excluir esta conversa?")) return;

    try {
      const { error } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

      if (error) {
        console.error("Erro ao excluir chat:", error.message);
        alert("Não foi possível excluir a conversa.");
        return;
      }

      // Remove localmente da lista instantaneamente
      setChats((prev) => prev.filter((c) => c.id !== chatId));

      // Se a conversa excluída era a ativa, volta para o estado inicial/nova conversa
      if (currentChatId === chatId) {
        onNewChat();
      }
    } catch (err) {
      console.error("Erro inesperado ao excluir chat:", err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#07090e] border-r border-white/5 flex flex-col h-full select-none z-10">
      {/* Botão Nova Conversa */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-medium transition-all"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Nova conversa</span>
        </button>
      </div>

      {/* Campo de Busca */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500/40"
          />
        </div>
      </div>

      {/* BLOCO SUPERIOR: Configurações e Módulos do Sistema logo abaixo da busca */}
      <div className="px-2 py-1 space-y-0.5 border-b border-white/5 pb-3">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-white/[0.02] border border-white/5"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Configurações</span>
        </button>

        <button
          onClick={() => onSelectTab("projects")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
            currentTab === "projects"
              ? "bg-white/10 text-emerald-300 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <FolderKanban className="w-4 h-4 text-emerald-400" />
          <span>SATIX Studio</span>
        </button>

        <button
          onClick={() => onSelectTab("agents")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
            currentTab === "agents"
              ? "bg-white/10 text-emerald-300 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Bot className="w-4 h-4 text-blue-400" />
          <span>Agentes</span>
        </button>

        <button
          onClick={() => onSelectTab("library")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
            currentTab === "library"
              ? "bg-white/10 text-emerald-300 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Library className="w-4 h-4 text-amber-400" />
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => onSelectTab("memory")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
            currentTab === "memory"
              ? "bg-white/10 text-emerald-300 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span>Memória</span>
        </button>
      </div>

      {/* Lista de Conversas do Supabase com Botão de Excluir */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-0.5">
        <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Conversas
        </div>

        {filteredChats.length === 0 ? (
          <div className="px-2 py-3 text-xs text-zinc-600 text-center">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`group relative w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                currentTab === "chat" && currentChatId === chat.id
                  ? "bg-white/10 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-6">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>

              {/* Botão de Lixeira que aparece ao passar o mouse */}
              <button
                type="button"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Excluir conversa"
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-opacity rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}