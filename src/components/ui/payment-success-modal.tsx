"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Crown, CheckCircle2, ArrowRight, X } from "lucide-react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentSuccessModal({ isOpen, onClose }: PaymentSuccessModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-emerald-500/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Luz de fundo decorativa */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Sucesso */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Crown className="w-8 h-8 fill-emerald-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Pagamento Aprovado
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Bem-vindo ao SATIX PRO!
        </h2>

        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
          Sua conta foi atualizada com sucesso. Agora você tem acesso irrestrito aos modelos e ferramentas mais potentes da plataforma:
        </p>

        <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6 space-y-2.5 text-left text-xs text-zinc-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Modelo <strong>Gemini 2.5 Pro</strong> desbloqueado no chat</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><strong>30 créditos mensais</strong> de criação/aprimoramento no Studio (Imagen 3)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Reconhecimento de voz contínuo e histórico estendido</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02]"
        >
          <span>Começar a Usar Agora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}