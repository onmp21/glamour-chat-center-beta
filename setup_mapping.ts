import { evolutionMessageService } from "./src/services/EvolutionMessageService";
import { supabase } from "./src/integrations/supabase/client";

async function setupChannelMapping() {
  const testMapping = {
    channel_id: "af1e5797-edc6-4ba3-a57a-25cf7297c4d6", // UUID para 'chat' ou 'Yelena-ai'
    instance_id: "test-instance-id",
    instance_name: "test-instance",
    api_key: "test-api-key",
    base_url: "https://test-evolution-api.com",
    is_active: true,
  };

  console.log("Attempting to create or update channel mapping...");
  const result = await evolutionMessageService.createOrUpdateChannelMapping(testMapping);

  if (result.success) {
    console.log("Channel mapping created/updated successfully!");
  } else {
    console.error("Failed to create/update channel mapping:", result.error);
  }
}

setupChannelMapping();

