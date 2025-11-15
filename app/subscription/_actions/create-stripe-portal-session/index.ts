"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { resolveAppUrl } from "../../_utils/resolve-app-url";

export const createStripePortalSession = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not found");
  }

  const user = await clerkClient.users.getUser(userId);
  const stripeCustomerId = user.privateMetadata?.stripeCustomerId;

  if (typeof stripeCustomerId !== "string" || !stripeCustomerId.length) {
    throw new Error("Stripe customer not found");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = resolveAppUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/subscription`,
  });

  return { url: session.url };
};
