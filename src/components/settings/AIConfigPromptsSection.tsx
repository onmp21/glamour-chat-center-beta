
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AIPromptService, getPromptTypes, AIPromptType, AIPrompt } from "@/services/AIPromptService";
import { FileText, MessageSquare, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AIConfigPromptsSectionProps {
  isDarkMode: boolean;
}

function getInitialPromptsState(): Record<AIPromptType, AIPrompt | null> {
  const initial: Record<AIPromptType, AIPrompt | null> = {
    conversation_summary: null,
    quick_response: null,
    report_conversations: null,
    report_channels: null,
    report_custom: null,
    report_exams: null,
    summary: null,
    report: null,
  };
  return initial;
}

export const AIConfigPromptsSection: React.FC<AIConfigPromptsSectionProps> = ({ isDarkMode }) => {
  const [prompts, setPrompts] = useState<Record<AIPromptType, AIPrompt | null>>(getInitialPromptsState);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AIPromptType | null>(null);
  const [promptContent, setPromptContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await AIPromptService.getAllPrompts();
      const map: Record<AIPromptType, AIPrompt | null> = getInitialPromptsState();
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

  // Separar prompts do ChatOverlay dos prompts de Relatórios
  const chatPrompts = getPromptTypes().filter(p => 
    p.type === 'conversation_summary' || p.type === 'quick_response'
  );

  const reportPrompts = getPromptTypes().filter(p => 
    p.type.startsWith('report_') || p.type === 'summary' || p.type === 'report'
  );

  const renderPromptCard = (def: any) => (
    <Card key={def.type} className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          <CardTitle className={isDarkMode ? "text-white text-base" : "text-gray-900 text-base"}>
            {def.label}
          </CardTitle>
        </div>
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
              className="font-mono"
              rows={4}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => handleSave(def.type as AIPromptType)} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                "mt-1 rounded p-2 text-xs whitespace-pre-wrap font-mono " +
                (isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white text-gray-800")
              }
              style={{ minHeight: 56 }}
            >
              {prompts[def.type]?.prompt_content || def.defaultPrompt}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <Card className={`border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow"}`}>
        <CardContent className="space-y-6 pt-6">
          {loading ? (
            <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Carregando...</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Chat Overlay (2)
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  Relatórios ({reportPrompts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-4">
                {chatPrompts.map(renderPromptCard)}
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                {reportPrompts.map(renderPromptCard)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
