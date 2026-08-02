import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, Building2, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — MedeirosInfra" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

// Extrai o subdomínio do host para resolver a clínica
// Ex: sisluana.meudominio.com → sisluana | localhost/IP → null
function getSubdomainFromHost(host: string): string | null {
  const hostname = (host || "").split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  const naoSub = ["localhost", "www", "app", "crm", "admin", "172", "10", "127", "192", "0", "::1"];
  if (parts.length < 3 || naoSub.includes(parts[0])) return null;
  return parts[0];
}

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve a clínica pelo subdomínio (para exibir o nome)
  const subdomain = typeof window !== "undefined" ? getSubdomainFromHost(window.location.host) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email.trim(), senha);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    // Login OK → vai para o dashboard
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            {subdomain ? `Painel da clínica "${subdomain}"` : "MedeirosInfra"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para acessar seu painel de gestão
          </p>
        </div>

        <Card className="border-border/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 text-sm"
                placeholder="voce@clinica.com.br"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Senha
              </Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5 h-11 text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="gradient-primary w-full shadow-glow font-semibold"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Entrar
            </Button>
          </form>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Motor White-Label — revenda de gestão para clínicas
        </p>
      </div>
    </div>
  );
}
