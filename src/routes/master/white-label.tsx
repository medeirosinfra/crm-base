import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/master/white-label")({
  head: () => ({ meta: [{ title: "White-Label — MedeirosInfra Master" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Ferramentas do Master"
      title="Envelopamento White-Label"
      description="Logo, cores, domínio próprio e API Key por clínica para revenda em escala."
      icon={Palette}
    />
  ),
});
