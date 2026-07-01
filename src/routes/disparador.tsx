import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareMore } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/disparador")({
  head: () => ({ meta: [{ title: "Disparador Multicanal — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Automação WhatsApp"
      title="Disparador Multicanal (WAHA)"
      description="Campanhas em massa segmentadas por tag, agendamento e integração direta com N8N."
      icon={MessageSquareMore}
    />
  ),
});
