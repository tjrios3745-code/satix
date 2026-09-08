"use client";

import React from "react";
import { Sparkles, Crown, LogOut, User as UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
  userTier?: string;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenPricing?: () => void;
}

export function Header({
  user,
  userTier = "free",
  onOpenAuth,
  onSignOut,
  onOpenPricing,
}: HeaderProps) {
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  return (
    <header className="h-14 w-full border-b border-white/5 bg-[#06070a]/60 backdrop-blur-md px-4 flex items-center justify-between z-20 relative">
      {/* Lado Esquerdo: Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm tracking-wide text-zinc-100">SATIX</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">
            v1.0
          </span>
        </div>
      </div>

      {/* Lado Direito: Ações, Plano e Usuário */}
      <div className="flex items-center gap-2.5">
        {/* Botão de Upgrade / Plano Ativo */}
        <button
          onClick={onOpenPricing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            userTier === "pro" || userTier === "business"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-emerald-400" />
          <span>{userTier.toUpperCase() === "FREE" ? "Upgrade PRO" : `Plano ${userTier.toUpperCase()}`}</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/5 border border-white/5">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={userName}
                  className="w-5 h-5 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  <UserIcon className="w-3 h-3" />
                </div>
              )}
              <span className="text-xs text-zinc-200 font-medium max-w-[120px] truncate">
                {userName}
              </span>
            </div>

            <button
              onClick={onSignOut}
              title="Sair da conta"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-100 font-medium border border-white/10 transition-colors"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}