"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Plus,
  FolderKanban,
  Bot,
  Library,
  BrainCircuit,
  Settings,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FeatureTab } from "../features/feature-view";

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  currentChatId: string | null;
  currentTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  currentChatId,
  currentTab,
  onSelectTab,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar conversas:", error);
      } else if (data) {
        setChats(data as ChatItem[]);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar histórico:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const handleStartRename = (e: React.MouseEvent, chat: ChatItem) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title || "");
  };

  const handleCancelRename = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleSaveRename = async (e?: React.MouseEvent | React.FormEvent, chatId?: string) => {
    if (e) e.stopPropagation();
    const idToUpdate = chatId || editingChatId;
    if (!idToUpdate) return;

    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) {
      handleCancelRename();
      return;
    }

    setChats((prev) =>
      prev.map((c) => (c.id === idToUpdate ? { ...c, title: trimmedTitle } : c))
    );
    setEditingChatId(null);

    try {
      const { error } = await supabase
        .from("chats")
        .update({ title: trimmedTitle })
        .eq("id", idToUpdate);

      if (error) {
        console.error("Erro ao atualizar o título:", error);
        fetchChats();
      }
    } catch (err) {
      console.error("Falha ao salvar título:", err);
      fetchChats();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename(undefined, chatId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRename();
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();

    await supabase.from("messages").delete().eq("chat_id", chatId);
    await supabase.from("chats").delete().eq("id", chatId);

    setChats((prev) => prev.filter((c) => c.id !== chatId));

    if (currentChatId === chatId) {
      onNewChat();
    }
  };

  const filteredChats = chats.filter((chat) =>
    (chat.title || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <aside className="w-64 border-r border-white/5 bg-[#06070a]/60 backdrop-blur-xl flex flex-col justify-between p-3 select-none">
      <div className="flex flex-col gap-3 overflow-hidden">
        <button
          onClick={() => {
            onSelectTab("chat");
            onNewChat();
          }}
          className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Nova conversa</span>
        </button>

        {/* Barra de busca */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white/5 border border-white/5 focus:border-emerald-500/40 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 p-0.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto max-h-[38vh] pr-1 scrollbar-thin scrollbar-thumb-white/10">
          <div
            onClick={() => onSelectTab("chat")}
            className="flex items-center justify-between px-2 py-1 cursor-pointer"
          >
            <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              Conversas
            </span>
          </div>

          {loadingChats ? (
            <div className="text-xs text-zinc-500 px-3 py-2 animate-pulse">
              Carregando histórico...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-xs text-zinc-600 px-3 py-2 italic">
              {searchTerm ? "Nenhum resultado encontrado." : "Nenhuma conversa salva."}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = chat.id === currentChatId && currentTab === "chat";
              const isEditing = chat.id === editingChatId;

              if (isEditing) {
                return (
                  <div
                    key={chat.id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 border border-emerald-500/30 text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      className="flex-1 bg-transparent text-zinc-100 text-xs outline-none border-b border-emerald-500/50 py-0.5 px-1 font-normal"
                    />
                    <button
                      onClick={(e) => handleSaveRename(e, chat.id)}
                      className="p-1 hover:text-emerald-400 text-zinc-300 transition-colors"
                      title="Salvar (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="p-1 hover:text-rose-400 text-zinc-400 transition-colors"
                      title="Cancelar (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectTab("chat");
                    onSelectChat(chat.id);
                  }}
                  onDoubleClick={(e) => handleStartRename(e, chat)}
                  title="Duplo clique para renomear"
                  className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-1">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{chat.title || "Sem título"}</span>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, chat)}
                      className="hover:text-emerald-400 p-1 rounded text-zinc-400 transition-colors"
                      title="Renomear conversa"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="hover:text-rose-400 p-1 rounded text-zinc-400 transition-colors"
                      title="Excluir conversa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-px bg-white/5 my-1" />

        {/* Módulos de Funcionalidades Ativados */}
        <nav className="flex flex-col gap-1 text-xs text-zinc-400">
          <button
            onClick={() => onSelectTab("projects")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentTab === "projects"
                ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                : "hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Projetos</span>
          </button>

          <button
            onClick={() => onSelectTab("agents")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentTab === "agents"
                ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                : "hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Agentes</span>
          </button>

          <button
            onClick={() => onSelectTab("library")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentTab === "library"
                ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                : "hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Biblioteca</span>
          </button>

          <button
            onClick={() => onSelectTab("memory")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentTab === "memory"
                ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                : "hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Memória</span>
          </button>
        </nav>
      </div>

      <div className="border-t border-white/5 pt-3">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  );
}