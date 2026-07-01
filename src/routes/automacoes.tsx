import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/automacoes")({
  head: () => ({ meta: [{ title: "Automações & IA — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Chatbot & IA"
      title="Automações & Assistente IA"
      description="Construtor visual drag-and-drop de fluxos integrado ao WAHA e ao N8N."
      icon={Bot}
    />
  ),
});
