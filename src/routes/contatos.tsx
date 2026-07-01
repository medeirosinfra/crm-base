import { createFileRoute } from "@tanstack/react-router";
import { Users2 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/contatos")({
  head: () => ({ meta: [{ title: "Contatos & Leads — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="CRM"
      title="Contatos & Leads"
      description="Base unificada de pacientes e leads, com tags, histórico e integração omnichannel."
      icon={Users2}
    />
  ),
});
