import { api } from "~/trpc/server";
import { SubscriptionForm } from "~/app/_components/SubscriptionForm";

export default async function NewSubscriptionPage() {
  // Fetch organizations and feeds for the form
  const [organizations, feeds] = await Promise.all([
    api.organization.getAll(),
    api.feed.getAll(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Subscription
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Set up a new subscription for an organization.
        </p>
      </div>

      <div>
        <SubscriptionForm organizations={organizations} feeds={feeds} />
      </div>
    </div>
  );
}
