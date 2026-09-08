"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Settings, 
  User as UserIcon, 
  Crown, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Check, 
  Calendar,
  Image as ImageIcon,
  Mail,
  ShieldCheck
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userTier: string;
  onOpenPricing: () => void;
  onClearHistory: () => void;
}

interface ProfileData {
  tier: string;
  image_credits: number;
  pro_expires_at: string | null;
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  userTier,
  onOpenPricing,
  onClearHistory,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "data">("account");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      supabase
        .from("profiles")
        .select("tier, image_credits, pro_expires_at")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data);
          }
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const effectiveTier = profile?.tier || userTier || "free";
  const imageCredits = profile?.image_credits ?? 0;
  const expiryDateFormatted = profile?.pro_expires_at
    ? new Date(profile.pro_expires_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : effectiveTier === "free"
    ? "Acesso Vitalício"
    : "Sem expiração fixa";

  const handleClearAllChats = async () => {
    if (!user) return;
    const confirm = window.confirm("Tem certeza que deseja apagar todas as conversas salvas no seu histórico?");
    if (!confirm) return;

    try {
      setClearing(true);
      const { error } = await supabase.from("chats").delete().eq("user_id", user.id);
      if (error) throw error;

      onClearHistory();
      setClearedMessage(true);
      setTimeout(() => setClearedMessage(false), 3000);
    } catch (err: any) {
      alert("Erro ao limpar histórico: " + err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Configurações</h2>
              <p className="text-xs text-zinc-400">Preferências da conta e do sistema</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas e Painel */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-[380px]">
          
          {/* Navegação Lateral */}
          <div className="w-full sm:w-48 p-3 border-b sm:border-b-0 sm:border-r border-white/10 bg-[#070a12]/50 flex sm:flex-col gap-1">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "account"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Conta & Plano</span>
            </button>

            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "preferences"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Preferências</span>
            </button>

            <button
              onClick={() => setActiveTab("data")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "data"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Dados & Histórico</span>
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Conta & Plano */}
            {activeTab === "account" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-1">Perfil do Usuário</h3>
                  <p className="text-xs text-zinc-400">Informações vinculadas à sua conta no SATIX.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[11px] text-zinc-500 block mb-1">Nome / Usuário</span>
                    <span className="text-xs font-medium text-zinc-200">{userName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[11px] text-zinc-500 block mb-1">E-mail</span>
                    <span className="text-xs font-medium text-zinc-200 truncate block">
                      {user?.email || "Visitante não logado"}
                    </span>
                  </div>
                </div>

                {/* Métricas do Plano */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold block mb-1">Tier</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">{effectiveTier}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold block mb-1">Créditos Imagem</span>
                    <span className="text-xs font-bold text-zinc-200">{imageCredits} restantes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold block mb-1">Validade</span>
                    <span className="text-xs font-bold text-zinc-200">{expiryDateFormatted}</span>
                  </div>
                </div>

                {/* Cartão de Assinatura */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-2">Assinatura Ativa</h3>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white uppercase">Plano {effectiveTier}</span>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {effectiveTier === "free"
                            ? "Plano gratuito com cotas básicas"
                            : "Acesso desbloqueado a Gemini 2.5 Pro & Imagen 3"}
                        </p>
                      </div>
                    </div>

                    {effectiveTier === "free" && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPricing();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Fazer Upgrade</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preferências */}
            {activeTab === "preferences" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-1">Comportamento da IA</h3>
                  <p className="text-xs text-zinc-400">Personalize o fluxo de interação e respostas.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Respostas em Streaming</div>
                      <div className="text-[11px] text-zinc-500">Transmissão em tempo real token por token</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Reconhecimento de Voz (Voz para Texto)</div>
                      <div className="text-[11px] text-zinc-500">Microfone habilitado para Português (pt-BR)</div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Ativo</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Editor SATIX Studio</div>
                      <div className="text-[11px] text-zinc-500">Recorte neural com aceleração WebAssembly</div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Ativo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dados & Histórico */}
            {activeTab === "data" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-1">Gerenciamento de Dados</h3>
                  <p className="text-xs text-zinc-400">Controle e exclusão de histórico de conversas.</p>
                </div>

                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-red-400">Apagar Todas as Conversas</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Esta ação removerá definitivamente todos os chats e mensagens vinculados à sua conta.
                    </div>
                  </div>

                  <button
                    onClick={handleClearAllChats}
                    disabled={clearing || !user}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{clearing ? "Apagando..." : "Limpar Todo o Histórico"}</span>
                  </button>

                  {clearedMessage && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Histórico apagado com sucesso!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}