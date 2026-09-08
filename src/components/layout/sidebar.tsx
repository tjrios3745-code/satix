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
  Plus
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

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setChats(data);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico de chats:", err);
      }
    };

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

      {/* Botão Configurações logo abaixo da busca / topo da seção */}
      <div className="px-3 pb-2 border-b border-white/5">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-white/[0.02] border border-white/5"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Lista de Conversas do Supabase */}
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
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left truncate ${
                currentTab === "chat" && currentChatId === chat.id
                  ? "bg-white/10 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))
        )}
      </div>

      {/* Módulos do Sistema no Rodapé */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
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
    </aside>
  );
}