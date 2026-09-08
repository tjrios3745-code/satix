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

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode, imageBase64, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Faça login para utilizar as ferramentas generativas do Studio." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("tier, image_credits, pro_expires_at")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Perfil de usuário não encontrado." },
        { status: 404 }
      );
    }

    const isProOrBusiness = profile.tier === "pro" || profile.tier === "business";
    const isExpired = profile.pro_expires_at && new Date(profile.pro_expires_at) < new Date();

    if (!isProOrBusiness || isExpired) {
      return NextResponse.json(
        { error: "A criação e aprimoramento de imagem com Imagen 3 são exclusivos dos planos PRO e BUSINESS." },
        { status: 403 }
      );
    }

    if ((profile.image_credits || 0) <= 0) {
      return NextResponse.json(
        { error: "Seus créditos mensais de imagem se esgotaram. Aguarde a renovação ou faça upgrade." },
        { status: 403 }
      );
    }

    if (!prompt && mode !== "enhance") {
      return NextResponse.json(
        { error: "Prompt é obrigatório para geração de imagens." },
        { status: 400 }
      );
    }

    let generatedBytes: string | undefined;

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

      generatedBytes = response.generatedImages?.[0]?.image?.imageBytes;
    }

    if (mode === "enhance") {
      if (!imageBase64) {
        return NextResponse.json(
          { error: "Imagem base é necessária para o aprimoramento." },
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

      generatedBytes = response.generatedImages?.[0]?.image?.imageBytes;
    }

    if (!generatedBytes) {
      throw new Error("O modelo de IA não retornou a imagem gerada.");
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        image_credits: Math.max(0, (profile.image_credits || 1) - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({
      imageUrl: `data:image/jpeg;base64,${generatedBytes}`,
      remainingCredits: (profile.image_credits || 1) - 1,
    });
  } catch (error: any) {
    console.error("Erro na rota do Studio:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar imagem no Studio." },
      { status: 500 }
    );
  }
}