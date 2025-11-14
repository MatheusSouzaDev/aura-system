import { auth, clerkClient } from "@clerk/nextjs/server";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "../_components/ui/card";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import AcquirePlanButton from "./_components/acquire-plan-button";
import { Badge } from "../_components/ui/badge";
import { getCurrentMonthTransactions } from "../_data/get-current-month-transactions";
import {
  VISIBLE_SUBSCRIPTION_PLANS,
  getActiveSubscriptionPlan,
} from "../_constants/subscription-plans";

const SubscriptionPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const user = await clerkClient.users.getUser(userId);
  const currentMonthTransactions = await getCurrentMonthTransactions();
  const activePlan = getActiveSubscriptionPlan(
    (user.publicMetadata.subscriptionPlan as string | undefined) ?? undefined,
  );

  return (
    <>
      <Navbar />
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {VISIBLE_SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = plan.slug === activePlan.slug;
            const formattedPrice = (plan.priceInCents / 100)
              .toFixed(2)
              .replace(".", ",");

            const limitInfo = plan.capabilities.transactionsLimit
              ? `${currentMonthTransactions}/${plan.capabilities.transactionsLimit}`
              : null;

            return (
              <Card
                key={plan.slug}
                className={`relative w-full overflow-hidden ${
                  plan.accentClassName ?? ""
                } ${
                  plan.highlight
                    ? "border-primary/40 shadow-lg shadow-primary/10"
                    : ""
                }`}
              >
                <CardHeader className="border-b border-solid py-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold">{plan.name}</h2>
                      {plan.badge && (
                        <Badge className="rounded-full bg-primary/10 text-primary">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-baseline justify-center gap-2">
                    <span className="text-4xl">{plan.currency}</span>
                    <span className="text-6xl font-semibold">
                      {formattedPrice}
                    </span>
                    <span className="text-2xl text-muted-foreground">
                      {plan.billingPeriodLabel}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex h-full flex-col gap-6 py-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => {
                      const Icon = feature.included
                        ? CheckIcon
                        : plan.type === "free"
                          ? MinusIcon
                          : XIcon;

                      return (
                        <li
                          key={feature.label}
                          className="flex items-start gap-3 text-left"
                        >
                          <Icon
                            className={
                              feature.included
                                ? "mt-1 h-4 w-4 text-primary"
                                : "mt-1 h-4 w-4 text-muted-foreground"
                            }
                          />
                          <span className="text-sm font-medium">
                            {feature.label}
                            {feature.label.includes("transações") &&
                              limitInfo && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({limitInfo})
                                </span>
                              )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <AcquirePlanButton plan={plan} isActive={isActive} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
