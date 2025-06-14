
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIProviderSettings } from "../ai-providers/AIProviderSettings";
import { AIConfigPromptsSection } from "./AIConfigPromptsSection";
import { Brain, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIConfigSectionProps {
  isDarkMode: boolean;
}

export const AIConfigSection: React.FC<AIConfigSectionProps> = ({ isDarkMode }) => {
  const [tab, setTab] = useState("providers");
  return (
    <div className="max-w-4xl mx-auto my-4">
      <Tabs value={tab} onValueChange={setTab} className="">
        <TabsList className={cn("flex p-1 rounded-lg mb-6 w-full bg-card gap-2",
          isDarkMode ? "bg-[#18181b]" : "bg-gray-100 border-gray-200")}>
          <TabsTrigger value="providers" className={cn("flex items-center gap-2 px-4 py-2 font-medium rounded-lg data-[state=active]:bg-[#b5103c] data-[state=active]:text-white data-[state=inactive]:bg-none transition-all",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            <Brain size={18} />
            Provedores de IA
          </TabsTrigger>
          <TabsTrigger value="prompts" className={cn("flex items-center gap-2 px-4 py-2 font-medium rounded-lg data-[state=active]:bg-[#b5103c] data-[state=active]:text-white data-[state=inactive]:bg-none transition-all",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            <FileText size={18} />
            Prompts de IA
          </TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="pt-1">
          <AIProviderSettings />
        </TabsContent>
        <TabsContent value="prompts" className="pt-1">
          <AIConfigPromptsSection isDarkMode={isDarkMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
