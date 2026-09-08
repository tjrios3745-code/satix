import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BACKUP_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("Chave GEMINI_API_KEY não configurada", { status: 500 });
    }

    const { messages, model: requestedModel, attachments, agentId } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("Formato de mensagens inválido", { status: 400 });
    }

    // 1. Busca as instruções de memória persistidas no banco
    const { data: memoryRows } = await supabase
      .from("memories")
      .select("content")
      .order("created_at", { ascending: true });

    const memoryInstructions = (memoryRows || [])
      .map((m) => `- ${m.content}`)
      .join("\n");

    // 2. Busca o agente selecionado ou o agente ativo padrão
    let agentPrompt = "Você é o SATIX, um assistente AI focado em eficiência e alto desempenho.";
    if (agentId) {
      const { data: agentData } = await supabase
        .from("agents")
        .select("system_prompt")
        .eq("id", agentId)
        .single();
      if (agentData?.system_prompt) {
        agentPrompt = agentData.system_prompt;
      }
    } else {
      const { data: defaultAgent } = await supabase
        .from("agents")
        .select("system_prompt")
        .eq("is_active", true)
        .single();
      if (defaultAgent?.system_prompt) {
        agentPrompt = defaultAgent.system_prompt;
      }
    }

    // 3. Monta a System Instruction unificada
    const fullSystemInstruction = `
${agentPrompt}

${memoryInstructions ? `DIRETRIZES E PREFERÊNCIAS PERMANENTES DO USUÁRIO (MEMÓRIA):\n${memoryInstructions}` : ""}
`.trim();

    const previousMessages = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1];

    const history = previousMessages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const currentParts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        if (file.base64 && file.type) {
          currentParts.push({
            inlineData: {
              data: file.base64,
              mimeType: file.type,
            },
          });
        }
      }
    }

    const textContent = latestMessage.content.trim() || "Analise os arquivos enviados.";
    currentParts.push({ text: textContent });

    const genAI = new GoogleGenerativeAI(apiKey);

    const targetModels = requestedModel
      ? [requestedModel, ...BACKUP_MODELS.filter((m) => m !== requestedModel)]
      : BACKUP_MODELS;

    let activeStream: any = null;
    let lastError: any = null;

    for (const modelName of targetModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullSystemInstruction,
        });

        const chat = model.startChat({ history });
        const streamResult = await chat.sendMessageStream(currentParts);

        const iterator = streamResult.stream[Symbol.asyncIterator]();
        const firstChunk = await iterator.next();

        if (!firstChunk.done && firstChunk.value) {
          activeStream = {
            firstText: firstChunk.value.text(),
            iterator,
          };
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Falha no modelo ${modelName}:`, err?.message || err);
      }
    }

    if (!activeStream) {
      throw lastError || new Error("Nenhum modelo respondeu a tempo.");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (activeStream.firstText) {
            controller.enqueue(encoder.encode(activeStream.firstText));
          }

          while (true) {
            const { done, value } = await activeStream.iterator.next();
            if (done) break;

            try {
              const text = value.text();
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {}
          }
        } catch (streamErr) {
          console.error("Erro na transmissão:", streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Erro na rota de chat:", error);
    return new Response(error?.message || "Erro interno", { status: 500 });
  }
}