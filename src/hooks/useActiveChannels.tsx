
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

      if (!error && data) setChannels(data as DomainChannel[]);
      setLoading(false);
    }

    fetchChannels();
  }, []);

  return { channels, loading };
}
