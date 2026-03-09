import { useQuery } from "@tanstack/react-query";
import { useAuth } from "~/contexts/auth-context";
import { useRequestedAccessContext } from "~/contexts/requested-access-context";
import { getMyOrganizationQueryOptions } from "~/lib/services/clients.service";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

export default function useMyOrganization() {
  const { user } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const requestedAccessContext = useRequestedAccessContext();
  const { data, isLoading, error } = useQuery(
    getMyOrganizationQueryOptions(fetchOrThrow, {
      clientId: requestedAccessContext.currentClientId,
      siteId: requestedAccessContext.currentSiteId,
    })
  );

  return {
    client: data?.client,
    site: data?.site,
    isLoading,
    error,
    user,
  };
}
