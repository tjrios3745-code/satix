"use client";

import { LogIn, LogOut, User as UserIcon, Zap } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export function Header({ user, onOpenAuth, onSignOut }: HeaderProps) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email;

  return (
    <header className="h-14 border-b border-white/5 bg-[#06070a]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 select-none">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Zap className="w-4 h-4 fill-emerald-400" />
        </div>
        <span className="font-semibold text-sm tracking-wider text-zinc-100">SATIX</span>
        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          v1.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-zinc-300">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-4 h-4 rounded-full object-cover border border-white/10"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="max-w-[140px] truncate">{displayName}</span>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
}