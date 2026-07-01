import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
  eyebrow,
}: {
  title: string;
  description: string;
  eyebrow: string;
  icon?: LucideIcon;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>

        <Card className="gradient-surface shadow-card mt-8 flex flex-col items-center justify-center gap-4 border-border/60 p-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Módulo em construção
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ative o Lovable Cloud para persistir dados reais. As telas visuais deste módulo
              serão liberadas nas próximas iterações do roadmap.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
