import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_ACCESS_TOKEN não configurada." },
        { status: 500 }
      );
    }

    const { userId, userEmail, tier = "pro" } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken: accessToken.trim(),
    });

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
          email: userEmail || "cliente@satix.com",
        },
        metadata: {
          user_id: userId,
          tier: tier,
        },
        payment_methods: {
          excluded_payment_types: [], // Não exclui nenhum método (mantém Pix, Cartão, Boleto, Débito)
          installments: 12,           // Permite parcelamento em até 12x no cartão
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
    console.error("Erro na API de Checkout:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar checkout." },
      { status: 500 }
    );
  }
}