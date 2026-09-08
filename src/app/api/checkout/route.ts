import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, tier = "pro" } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário precisa estar autenticado para assinar." },
        { status: 401 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://satix-omega.vercel.app";

    const isBusiness = tier === "business";
    const title = isBusiness ? "SATIX - Plano Business" : "SATIX - Plano PRO Mensal";
    const price = isBusiness ? 79.0 : 29.0;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: `satix-${tier}`,
            title: title,
            quantity: 1,
            unit_price: price,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: userEmail || undefined,
        },
        metadata: {
          user_id: userId,
          tier: tier,
        },
        back_urls: {
          success: `${appUrl}/?payment=success`,
          failure: `${appUrl}/?payment=failure`,
          pending: `${appUrl}/?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      },
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao iniciar pagamento." },
      { status: 500 }
    );
  }
}