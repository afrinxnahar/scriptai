"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  credits_monthly: number;
  features: string[];
  is_active: boolean;
  stripe_price_id: string | null;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
}

interface BillingInfo {
  currentPlan: Plan | null;
  subscription: SubscriptionInfo | null;
  credits: number;
}

export function useBilling() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.get<Plan[]>("/api/v1/billing/plans");
      setPlans(data);
    } catch {
      toast.error("Failed to load plans");
    }
  }, []);

  const fetchBillingInfo = useCallback(async () => {
    try {
      const data = await api.get<BillingInfo>("/api/v1/billing/info", {
        requireAuth: true,
      });
      setBillingInfo(data);
    } catch {
      toast.error("Failed to load billing info");
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchBillingInfo()]);
    setLoading(false);
  }, [fetchPlans, fetchBillingInfo]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const subscribe = useCallback(async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const { url } = await api.post<{ url: string }>(
        "/api/v1/billing/checkout",
        { planId },
        { requireAuth: true },
      );
      if (url) window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast.error(message);
    } finally {
      setCheckoutLoading(null);
    }
  }, []);

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.post<{ url: string }>(
        "/api/v1/billing/portal",
        {},
        { requireAuth: true },
      );
      if (url) window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal";
      toast.error(message);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  return {
    plans,
    billingInfo,
    loading,
    checkoutLoading,
    portalLoading,
    subscribe,
    openPortal,
    refresh: loadAll,
  };
}
