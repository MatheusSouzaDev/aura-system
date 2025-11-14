"use server";

import {
  SUBSCRIPTION_PLAN_BY_ID,
  isPaidSubscriptionPlanId,
  PaidSubscriptionPlanId,
} from "@/app/_constants/subscription-plans";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

interface CreateStripeCheckoutParams {
  planId: PaidSubscriptionPlanId;
}

const resolveAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

export const createStripeCheckout = async ({
  planId,
}: CreateStripeCheckoutParams) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not found");
  }

  if (!isPaidSubscriptionPlanId(planId)) {
    throw new Error("Invalid plan");
  }

  const plan = SUBSCRIPTION_PLAN_BY_ID[planId];

  if (!plan || plan.type !== "paid" || !plan.stripePriceIdEnvKey) {
    throw new Error("Selected plan is not available for checkout");
  }

  const priceId = process.env[plan.stripePriceIdEnvKey];

  if (!priceId) {
    throw new Error(`Stripe price ID not found for plan ${plan.slug}`);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const appUrl = resolveAppUrl();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    success_url: appUrl,
    cancel_url: appUrl,
    subscription_data: {
      metadata: {
        clerk_user_id: userId,
        plan_id: plan.slug,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      clerk_user_id: userId,
      plan_id: plan.slug,
    },
  });

  return { sessionId: session.id };
};
