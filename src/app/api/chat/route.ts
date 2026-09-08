import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface IncomingAttachment {
  name: string;
  type: string;
  base64: string;
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { model, messages, attachments = [], userId } = await req.json();

    // Modelo padrão estável atualizado
    const selectedModel = model || "gemini-2.5-flash";

    // Trava de segurança: Modelos Pro exigem assinatura ativa
    if (selectedModel.includes("pro")) {
      if (!userId) {
        return NextResponse.json(
          { error: "Faça login e assine o plano PRO para utilizar os modelos Pro." },
          { status: 403 }
        );
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("tier, pro_expires_at")
        .eq("id", userId)
        .single();

      const isProOrBusiness = profile?.tier === "pro" || profile?.tier === "business";
      const isExpired = profile?.pro_expires_at && new Date(profile.pro_expires_at) < new Date();

      if (!isProOrBusiness || isExpired) {
        return NextResponse.json(
          { error: "Este modelo avançado é exclusivo para assinantes dos planos PRO ou BUSINESS." },
          { status: 403 }
        );
      }
    }

    const formattedContents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg: IncomingMessage = messages[i];
      const isLast = i === messages.length - 1;

      if (msg.role === "user") {
        const parts: any[] = [];

        if (isLast && attachments.length > 0) {
          for (const att of attachments as IncomingAttachment[]) {
            if (att.base64) {
              parts.push({
                inlineData: {
                  mimeType: att.type,
                  data: att.base64,
                },
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          formattedContents.push({
            role: "user",
            parts: parts,
          });
        }
      } else if (msg.role === "assistant") {
        if (msg.content) {
          formattedContents.push({
            role: "model",
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction:
          "Você é o SATIX, um assistente de inteligência artificial de elite, multimodal, ultra veloz, preciso e profissional. Sempre responda no idioma em que for abordado com formatação Markdown impecável.",
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Erro na rota de chat:", error);
    return NextResponse.json(
      { error: error?.message || "Falha interna ao comunicar com a IA." },
      { status: 500 }
    );
  }
}