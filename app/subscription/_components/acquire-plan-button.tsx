"use client";

import { Button } from "@/app/_components/ui/button";
import { createStripeCheckout } from "../_actions/create-stripe-checkout";
import { createStripePortalSession } from "../_actions/create-stripe-portal-session";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/app/_constants/subscription-plans";
import { isPaidSubscriptionPlan } from "@/app/_constants/subscription-plans";

interface AcquirePlanButtonProps {
  plan: SubscriptionPlan;
  isActive: boolean;
}

const AcquirePlanButton = ({ plan, isActive }: AcquirePlanButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isFreePlan = plan.type === "free";
  const isPaidPlan = isPaidSubscriptionPlan(plan);

  const handleAquirePlanClick = async () => {
    if (!isPaidPlan) {
      return;
    }

    try {
      setIsLoading(true);
      const { sessionId } = await createStripeCheckout({ planId: plan.slug });
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key not found");
      }
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );
      if (!stripe) {
        throw new Error("Stripe not initialized");
      }
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível iniciar o checkout. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagePlanClick = async () => {
    try {
      setIsLoading(true);
      const { url } = await createStripePortalSession();
      if (!url) {
        throw new Error("Portal URL not received");
      }
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível abrir o portal do cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isActive) {
    if (isFreePlan) {
      return (
        <Button className="w-full rounded-full font-semibold" disabled>
          Plano atual
        </Button>
      );
    }

    return (
      <Button
        className="w-full rounded-full font-bold"
        onClick={handleManagePlanClick}
        disabled={isLoading}
      >
        {isLoading ? "Redirecionando..." : "Gerenciar plano"}
      </Button>
    );
  }

  if (isFreePlan) {
    return (
      <Button className="w-full rounded-full font-semibold" disabled>
        Incluído
      </Button>
    );
  }

  return (
    <Button
      className="w-full rounded-full font-bold"
      onClick={handleAquirePlanClick}
      disabled={isLoading || !isPaidPlan}
    >
      {isLoading ? "Redirecionando..." : "Assinar plano"}
    </Button>
  );
};

export default AcquirePlanButton;
 
