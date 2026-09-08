import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode, imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!prompt && mode !== "enhance") {
      return NextResponse.json(
        { error: "Prompt é obrigatório para geração de imagens." },
        { status: 400 }
      );
    }

    // Modo 1: Geração de nova imagem a partir de texto (Text-to-Image)
    if (mode === "create") {
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      });

      const generatedImage = response.generatedImages?.[0]?.image?.imageBytes;
      if (!generatedImage) {
        throw new Error("O modelo não retornou nenhuma imagem gerada.");
      }

      return NextResponse.json({
        imageUrl: `data:image/jpeg;base64,${generatedImage}`,
      });
    }

    // Modo 2: Aprimorar / Variação a partir de imagem existente
    if (mode === "enhance") {
      if (!imageBase64) {
        return NextResponse.json(
          { error: "Imagem base é necessária para aprimoramento." },
          { status: 400 }
        );
      }

      const enhancePrompt = prompt
        ? `Enhance and regenerate this image with high fidelity, 4k ultra-detailed resolution, cinematic studio lighting: ${prompt}`
        : "Upscale and enhance this image, improve clarity, contrast, sharp details, reduce noise, cinematic studio lighting, photorealistic quality.";

      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: enhancePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      });

      const generatedImage = response.generatedImages?.[0]?.image?.imageBytes;
      if (!generatedImage) {
        throw new Error("Não foi possível gerar a versão aprimorada.");
      }

      return NextResponse.json({
        imageUrl: `data:image/jpeg;base64,${generatedImage}`,
      });
    }

    return NextResponse.json({ error: "Modo de operação inválido." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na rota de geração do Studio:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar imagem com IA." },
      { status: 500 }
    );
  }
}