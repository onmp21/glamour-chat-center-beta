
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DomainChannel } from "@/types/domain/Channel";

export function useActiveChannels() {
  const [channels, setChannels] = useState<DomainChannel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchChannels() {
      setLoading(true);
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        // Map supabase response to DomainChannel shape
        setChannels(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            displayName: c.name, // supabase doesn't have displayName: fallback to name
            isActive: c.is_active,
            tableName: c.type ? `${c.name.toLowerCase()}_conversas` : "",
            description: "", // Optionally fill if available
            icon: ""
          }))
        );
      }
      setLoading(false);
    }

    fetchChannels();
  }, []);

  return { channels, loading };
}
