import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

type RoleGuardProps = {
  required_roles?: ("admin" | "user")[];
  redirect_to?: string;
  children?: React.ReactNode;
};

export function useRoleGuard({
  required_roles,
  redirect_to = "/auth/signin",
}: Omit<RoleGuardProps, "children">) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: user_data, isLoading: isUserLoading } =
    api.admin.getUserDetails.useQuery(
      { userId: session?.user?.id ?? "" },
      {
        enabled: !!session?.user?.id,
      },
    );

  const is_loading = status === "loading" || isUserLoading;
  const is_authenticated = status === "authenticated" && !!session?.user;

  const has_required_role = required_roles
    ? required_roles.includes(user_data?.role as "admin" | "user")
    : true;

  useEffect(() => {
    if (!is_loading) {
      if (!is_authenticated) {
        router.push(redirect_to);
      } else if (required_roles && !has_required_role) {
        router.push("/dashboard");
      }
    }
  }, [
    is_loading,
    is_authenticated,
    has_required_role,
    router,
    redirect_to,
    required_roles,
  ]);

  return {
    is_loading,
    is_authenticated,
    has_required_role,
    user: user_data,
  };
}

export function RoleGuard({
  required_roles,
  redirect_to,
  children,
}: RoleGuardProps) {
  const { is_loading, is_authenticated, has_required_role } = useRoleGuard({
    required_roles,
    redirect_to,
  });

  if (is_loading) {
    return <div>Loading...</div>;
  }

  if (!is_authenticated || !has_required_role) {
    return null;
  }

  return <>{children}</>;
}
