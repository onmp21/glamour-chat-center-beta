
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AIPromptService, getPromptTypes, AIPromptType, AIPrompt } from "@/services/AIPromptService";

interface AIConfigPromptsSectionProps {
  isDarkMode: boolean;
}

export const AIConfigPromptsSection: React.FC<AIConfigPromptsSectionProps> = ({ isDarkMode }) => {
  const [prompts, setPrompts] = useState<Record<AIPromptType, AIPrompt | null>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AIPromptType | null>(null);
  const [promptContent, setPromptContent] = useState<string>("");

  // Carregar prompts existentes ao montar
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await AIPromptService.getAllPrompts();
      const map: Record<AIPromptType, AIPrompt | null> = {};
      for (const t of getPromptTypes()) {
        const found = data.find((p) => p.prompt_type === t.type);
        map[t.type as AIPromptType] = found || null;
      }
      setPrompts(map);
    } catch (e) {
      toast({
        title: "Erro",
        description: "Erro ao carregar prompts de IA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: AIPromptType) => {
    setEditing(type);
    setPromptContent(
      prompts[type]?.prompt_content || getPromptTypes().find((p) => p.type === type)?.defaultPrompt || ""
    );
  };

  const handleSave = async (type: AIPromptType) => {
    try {
      await AIPromptService.upsertPrompt({
        prompt_type: type,
        name: getPromptTypes().find((p) => p.type === type)?.label || "",
        prompt_content: promptContent,
        description: getPromptTypes().find((p) => p.type === type)?.description,
        is_active: true,
      });
      toast({ title: "Sucesso", description: "Prompt salvo." });
      setEditing(null);
      loadPrompts();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o prompt.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreDefault = async (type: AIPromptType) => {
    try {
      await AIPromptService.restoreDefaultPrompt(type);
      toast({ title: "Restaurado", description: "Prompt restaurado para o padrão." });
      setEditing(null);
      loadPrompts();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o prompt padrão.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`mt-10 border ${isDarkMode ? "bg-[#232323] border-[#333]" : "bg-white border-gray-200"} shadow`}>
      <CardHeader className="pb-1">
        <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
          Configuração de Prompts de IA
        </CardTitle>
        <p className={isDarkMode ? "text-gray-300 text-sm mt-2" : "text-gray-600 text-sm mt-2"}>
          Personalize aqui os prompts de cada função de IA utilizada na plataforma.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {getPromptTypes().map((def) => (
              <Card key={def.type} className={isDarkMode ? "bg-[#181818] border-[#333]" : "bg-gray-50 border-gray-200"}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className={isDarkMode ? "text-white text-base" : "text-gray-900 text-base"}>
                    {def.label}
                  </CardTitle>
                  {editing !== def.type && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2"
                      onClick={() => handleEdit(def.type as AIPromptType)}
                    >
                      Editar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className={isDarkMode ? "text-gray-400 text-xs mb-2" : "text-gray-600 text-xs mb-2"}>
                    {def.description}
                  </p>
                  {editing === def.type ? (
                    <div className="space-y-2">
                      <Label>Prompt</Label>
                      <Textarea
                        value={promptContent}
                        onChange={(e) => setPromptContent(e.target.value)}
                        className={isDarkMode ? "bg-[#232323] border-[#444] text-white" : "bg-white border-gray-300"}
                        rows={4}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleSave(def.type as AIPromptType)} className="bg-[#b5103c] text-white">
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                          Cancelar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRestoreDefault(def.type as AIPromptType)}>
                          Restaurar Padrão
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Prompt Atual:</Label>
                      <div
                        className={
                          "mt-1 rounded p-2 text-xs whitespace-pre-wrap " +
                          (isDarkMode ? "bg-[#232323] text-gray-50" : "bg-white text-gray-800")
                        }
                        style={{ minHeight: 56 }}
                      >
                        {prompts[def.type]?.prompt_content || def.defaultPrompt}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
