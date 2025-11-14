const paidPlanIds = ["plus", "premium"] as const;
export type PaidSubscriptionPlanId = (typeof paidPlanIds)[number];

export type SubscriptionPlanSlug = "basic" | PaidSubscriptionPlanId;

interface PlanFeature {
  label: string;
  included: boolean;
}

export interface SubscriptionPlan {
  slug: SubscriptionPlanSlug;
  name: string;
  priceInCents: number;
  currency: string;
  billingPeriodLabel: string;
  description: string;
  features: PlanFeature[];
  badge?: string;
  highlight?: boolean;
  accentClassName?: string;
  stripePriceIdEnvKey?: string;
  type: "free" | "paid";
  visible: boolean;
  capabilities: {
    aiReports: boolean;
    transactionsLimit?: number | null;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    slug: "basic",
    name: "Plano Básico",
    priceInCents: 0,
    currency: "R$",
    billingPeriodLabel: "/mês",
    description:
      "Comece gratuitamente e organize suas finanças com recursos essenciais.",
    features: [
      { label: "Até 10 transações por mês", included: true },
      { label: "Relatórios com IA", included: false },
      { label: "Suporte prioritário", included: false },
    ],
    type: "free",
    visible: true,
    capabilities: {
      aiReports: false,
      transactionsLimit: 10,
    },
  },
  {
    slug: "plus",
    name: "Plano Pro",
    priceInCents: 1990,
    currency: "R$",
    billingPeriodLabel: "/mês",
    description:
      "Para quem precisa de mais flexibilidade e relatórios inteligentes.",
    features: [
      { label: "Transações ilimitadas", included: true },
      { label: "Relatórios com IA", included: true },
      { label: "Suporte prioritário", included: false },
    ],
    badge: "Popular",
    highlight: true,
    stripePriceIdEnvKey: "STRIPE_PLUS_PLAN_PRICE_ID",
    type: "paid",
    visible: true,
    capabilities: {
      aiReports: true,
      transactionsLimit: null,
    },
  },
  {
    slug: "premium",
    name: "Plano Vision",
    priceInCents: 3990,
    currency: "R$",
    billingPeriodLabel: "/mês",
    description:
      "Tenha acesso a experiências premium de IA e indicadores avançados de performance.",
    features: [
      { label: "Transações ilimitadas", included: true },
      { label: "Relatórios com IA avançados", included: true },
      { label: "Suporte prioritário", included: true },
    ],
    badge: "Em breve",
    highlight: true,
    accentClassName:
      "border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background",
    stripePriceIdEnvKey: "STRIPE_PREMIUM_PLAN_PRICE_ID",
    type: "paid",
    visible: false,
    capabilities: {
      aiReports: true,
      transactionsLimit: null,
    },
  },
];

export const SUBSCRIPTION_PLAN_BY_SLUG = SUBSCRIPTION_PLANS.reduce(
  (acc, plan) => {
    acc[plan.slug] = plan;
    return acc;
  },
  {} as Record<SubscriptionPlanSlug, SubscriptionPlan>,
);

export const VISIBLE_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan) => plan.visible,
);

export const isPaidSubscriptionPlanId = (
  value: unknown,
): value is PaidSubscriptionPlanId =>
  typeof value === "string" &&
  paidPlanIds.includes(value as PaidSubscriptionPlanId);

export const PAID_SUBSCRIPTION_PLAN_IDS: PaidSubscriptionPlanId[] = [
  ...paidPlanIds,
];

export const SUBSCRIPTION_PLAN_BY_ID = PAID_SUBSCRIPTION_PLAN_IDS.reduce(
  (acc, planId) => {
    acc[planId] = SUBSCRIPTION_PLAN_BY_SLUG[planId];
    return acc;
  },
  {} as Record<PaidSubscriptionPlanId, SubscriptionPlan>,
);

export const getActiveSubscriptionPlan = (
  subscriptionPlanId?: string | null,
): SubscriptionPlan => {
  if (subscriptionPlanId && isPaidSubscriptionPlanId(subscriptionPlanId)) {
    return SUBSCRIPTION_PLAN_BY_ID[subscriptionPlanId];
  }

  return SUBSCRIPTION_PLAN_BY_SLUG.basic;
};

export const isPaidSubscriptionPlan = (
  plan: SubscriptionPlan,
): plan is SubscriptionPlan & { slug: PaidSubscriptionPlanId; type: "paid" } =>
  plan.type === "paid";
