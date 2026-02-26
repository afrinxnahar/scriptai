import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/components/supabase-provider";
import { api, ApiClientError } from "@/lib/api-client";
import type { Script } from "@repo/validation";

interface ScriptsContextType {
  scripts: Script[];
  loading: boolean;
  removeScript: (id: string) => Promise<void>;
  fetchScripts: () => Promise<void>;
}

const ScriptsContext = createContext<ScriptsContextType | undefined>(undefined);

export function ScriptsProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabase();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchScripts = async () => {
    try {
      const data = await api.get<Script[]>("/api/v1/script", { requireAuth: true });
      setScripts(data || []);
    } catch (error: unknown) {
      const message = error instanceof ApiClientError ? error.message : "An unexpected error occurred";
      toast.error("Error fetching scripts", { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchScripts();
  }, [user]);

  const removeScript = async (id: string) => {
    await api.delete(`/api/v1/script/${id}`, { requireAuth: true });
    setScripts((prev) => prev.filter((script) => script.id !== id));
  };

  return (
    <ScriptsContext.Provider value={{ scripts, loading, removeScript, fetchScripts }}>
      {children}
    </ScriptsContext.Provider>
  );
}

export function useScripts() {
  const context = useContext(ScriptsContext);
  if (undefined === context) {
    throw new Error("useScripts must be used within a ScriptsProvider");
  }
  return context;
}