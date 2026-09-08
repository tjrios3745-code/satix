"use client";

import React from "react";
import { X, Check, Zap, Sparkles, Crown, ArrowRight } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onSelectPlan?: (tier: string) => void;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    badge: null,
    description: "Perfeito para tarefas rápidas, estudos e experimentação diária.",
    features: [
      "Gemini Flash & Flash Lite ilimitados*",
      "SATIX Studio: Recorte de fundo ilimitado",
      "Editor com Canvas e filtros em tempo real",
      "Transmissão e respostas em streaming",
      "Histórico de conversas salvo no Supabase",
    ],
    cta: "Plano Atual",
    disabled: true,
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    badge: "Mais Popular",
    description: "Para criadores, desenvolvedores e profissionais que buscam alta performance.",
    features: [
      "Tudo do plano Free",
      "Acesso completo ao Gemini 2.5 Pro",
      "30 Gerações de Imagem com IA / mês",
      "Aprimoramento de fotos e luz com IA",
      "Entrada de voz em tempo real contínua",
      "Memória cognitiva e Agentes prioritários",
      "Exportação em Markdown e Texto puro",
    ],
    cta: "Assinar Plano Pro",
    disabled: false,
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "R$ 79",
    period: "/mês",
    badge: "Poder Máximo",
    description: "Para uso intensivo diário, automações, grandes volumes de mídia e código.",
    features: [
      "Tudo do plano Pro",
      "Uso prioritário sem fila nos servidores",
      "100 Gerações de Imagem com IA / mês",
      "Upload de documentos pesados e OCR",
      "Agentes personalizados ilimitados",
      "Suporte prioritário e novidades beta",
    ],
    cta: "Falar com Consultor",
    disabled: false,
    highlight: false,
  },
];

export function PricingModal({
  isOpen,
  onClose,
  currentTier = "free",
  onSelectPlan,
}: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090d16] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Planos SATIX
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-normal">
                  Evolua seu fluxo
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Escolha o plano ideal para suas demandas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-semibold text-zinc-100">
              Desbloqueie o poder total da IA multimodal
            </h3>
            <p className="text-xs text-zinc-400">
              Acesse modelos avançados de raciocínio, geração visual no Studio e funcionalidades pensadas para o seu dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch pt-2">
            {PLANS.map((plan) => {
              const isCurrent = currentTier === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-b from-[#101c3d]/70 to-[#0c1429]/90 border-2 border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.15)] scale-[1.02]"
                      : "bg-[#0b0f1b] border border-white/10 hover:border-white/20"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-semibold text-zinc-100">{plan.name}</h4>
                      {plan.highlight && <Sparkles className="w-4 h-4 text-emerald-400" />}
                    </div>

                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-white tracking-tight">{plan.price}</span>
                      <span className="text-xs text-zinc-400">{plan.period}</span>
                    </div>

                    <p className="text-xs text-zinc-400 mb-5 leading-relaxed">{plan.description}</p>

                    <div className="space-y-2.5 pt-3 border-t border-white/5">
                      <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                        O que inclui:
                      </span>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => onSelectPlan?.(plan.id)}
                      disabled={isCurrent || plan.disabled}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isCurrent
                          ? "bg-white/5 border border-white/10 text-zinc-400 cursor-default"
                          : plan.highlight
                          ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:scale-[1.01]"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                      }`}
                    >
                      <span>{isCurrent ? "Seu Plano Atual" : plan.cta}</span>
                      {!isCurrent && !plan.disabled && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[11px] text-zinc-500">
              * O plano Free utiliza cotas justas de uso diário do modelo Flash. Você pode cancelar ou alterar seu plano a qualquer momento sem fidelidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}