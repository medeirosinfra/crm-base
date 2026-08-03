import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/master/automacoes")({
  head: () => ({ meta: [{ title: "Automações & IA — MedeirosInfra Master" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Ferramentas do Master"
      title="Automações & Assistente IA"
      description="Disparo automático de mensagens, bots de atendimento e fluxos integrados ao WAHA e N8N."
      icon={Bot}
    />
  ),
});
