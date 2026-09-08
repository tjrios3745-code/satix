import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

// Inicializa Supabase com service_role para contornar RLS e atualizar o perfil
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    // Verifica se a notificação é de um pagamento
    if (topic === "payment" && id) {
      const paymentInstance = new Payment(client);
      const paymentData = await paymentInstance.get({ id: String(id) });

      if (paymentData.status === "approved") {
        const userId = paymentData.metadata?.user_id;
        const tier = paymentData.metadata?.tier || "pro";

        if (userId) {
          const creditsToAdd = tier === "business" ? 100 : 30;

          // Validade de 30 dias a partir da aprovação
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await supabaseAdmin
            .from("profiles")
            .update({
              tier: tier,
              image_credits: creditsToAdd,
              pro_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          console.log(`Plano ${tier.toUpperCase()} ativado para o usuário ${userId}`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Erro no webhook do Mercado Pago:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}