"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { resolveAppUrl } from "../../_utils/resolve-app-url";

interface StripePortalSessionResult {
  url: string | null;
  error?: string;
}

export const createStripePortalSession =
  async (): Promise<StripePortalSessionResult> => {
    const { userId } = await auth();
    if (!userId) {
      return {
        url: null,
        error: "Você precisa estar autenticado para gerenciar o plano.",
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { url: null, error: "Configuração da Stripe ausente." };
    }

    const user = await clerkClient.users.getUser(userId);
    const stripeCustomerId = user.privateMetadata?.stripeCustomerId;

    if (typeof stripeCustomerId !== "string" || !stripeCustomerId.length) {
      return {
        url: null,
        error:
          "Não encontramos seu cliente na Stripe. Tente assinar novamente ou contate o suporte.",
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = resolveAppUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/subscription`,
    });

    return { url: session.url };
  };
