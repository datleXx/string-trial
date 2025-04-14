import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { SubscriptionForm } from "~/app/_components/SubscriptionForm";

interface EditSubscriptionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubscriptionPage({
  params,
}: EditSubscriptionPageProps) {
  const subscriptionId = (await params).id;

  if (!subscriptionId) {
    notFound();
  }

  // Fetch subscription, organizations, and feeds
  const [subscription, organizations, feeds] = await Promise.all([
    api.subscription.getById({ id: subscriptionId }),
    api.organization.getAll(),
    api.feed.getAll(),
  ]);

  if (!subscription) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Subscription
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Update subscription details for {subscription.organization.name}.
        </p>
      </div>

      <div>
        <SubscriptionForm
          initialData={{
            ...subscription,
            dashboardUrl: subscription.dashboardUrl ?? null,
            deliveryMethod: subscription.deliveryMethod ?? null,
            deliveryConfig: subscription.deliveryConfig,
            successEmails: subscription.successEmails ?? [],
            failEmails: subscription.failEmails ?? [],
            schemaUpdateEmails: subscription.schemaUpdateEmails ?? [],
            billingFrequency: subscription.billingFrequency ?? "monthly",
          }}
          organizations={organizations}
          feeds={feeds}
        />
      </div>
    </div>
  );
}
