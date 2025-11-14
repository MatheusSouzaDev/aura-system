import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isPaidSubscriptionPlanId } from "@/app/_constants/subscription-plans";

export const POST = async (request: Request) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Stripe keys not configured" },
        { status: 500 },
      );
    }
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    const text = await request.text();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil",
    });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        text,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("⚠️  Webhook signature verification failed.", err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
        const subscriptionDetails =
          invoicePaymentSucceeded.parent?.subscription_details ?? null;
        const subscriptionMetadata = subscriptionDetails?.metadata ?? {};
        const rawPlanId = subscriptionMetadata?.plan_id;
        const customer = invoicePaymentSucceeded.customer;
        const subscription = subscriptionDetails?.subscription ?? null;
        const clerkUserId = subscriptionMetadata?.clerk_user_id;
        if (!clerkUserId) {
          return NextResponse.json(
            { error: "Missing clerk_user_id" },
            { status: 400 },
          );
        }
        const normalizedPlanId = isPaidSubscriptionPlanId(rawPlanId)
          ? rawPlanId
          : null;
        const resolvedCustomerId =
          typeof customer === "string" ? customer : (customer?.id ?? null);
        (await clerkClient()).users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: resolvedCustomerId,
            stripeSubscriptionId: subscription,
          },
          publicMetadata: {
            subscriptionPlan: normalizedPlanId,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata.clerk_user_id;
        if (!clerkUserId) {
          return NextResponse.json(
            { error: "Missing clerk_user_id" },
            { status: 400 },
          );
        }
        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
          publicMetadata: {
            subscriptionPlan: null,
          },
        });
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Erro no webhook handler:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
