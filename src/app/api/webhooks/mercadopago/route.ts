import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  return NextResponse.json({ status: "Webhook ativo e pronto para receber notificações" });
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!accessToken || !serviceKey || !supabaseUrl) {
      console.error("[Webhook MP] Variáveis de ambiente ausentes.");
      return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: accessToken.trim() });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Extrai o ID do pagamento da query string ou do corpo JSON
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (!paymentId) {
      try {
        const body = await req.json();
        paymentId = body?.data?.id || body?.id;
      } catch {
        // Body pode vir vazio em certas requisições de teste do MP
      }
    }

    console.log(`[Webhook MP] ID recebido: ${paymentId}`);

    if (paymentId) {
      const paymentInstance = new Payment(client);
      const paymentData = await paymentInstance.get({ id: String(paymentId) });

      console.log(`[Webhook MP] Status do pagamento ${paymentId}: ${paymentData.status}`);

      if (paymentData.status === "approved") {
        const userId = paymentData.metadata?.user_id;
        const tier = paymentData.metadata?.tier || "pro";

        if (userId) {
          const creditsToAdd = tier === "business" ? 100 : 30;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              tier: tier,
              image_credits: creditsToAdd,
              pro_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateError) {
            console.error("[Webhook MP] Erro ao atualizar Supabase:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
          }

          console.log(`[Webhook MP] Sucesso! Usuário ${userId} promovido para ${tier.toUpperCase()}`);
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook MP] Erro:", error);
    return NextResponse.json({ error: error?.message || "Erro no webhook" }, { status: 500 });
  }
}