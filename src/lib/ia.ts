// ============================================================
// Geração de mensagens de venda por IA (server-side)
// Chama o 9router/OpenRouter (OpenAI-compatible) do servidor.
// NUNCA importar no browser — a API key não pode vazar.
// ============================================================

const IA_BASE_URL = process.env.IA_BASE_URL || "http://172.16.0.50:20128";
const IA_API_KEY = process.env.IA_API_KEY || "sk-ac612fc97575275e-63mduk-b288472a";
const IA_MODEL = process.env.IA_MODEL || "meucombo";

export interface GerarMensagemInput {
  servico: string; // ex: "Harmonização Facial", "Lente de Contato Dental"
  clinica?: string; // nome da clínica (para personalizar)
  publico?: string; // ex: "mulheres 30-50", "comércios da região"
  tom?: string; // profissional | amigável | promo
}

const TOMES: Record<string, string> = {
  profissional: "tom profissional, objetivo e confiável",
  amigavel: "tom amigável, próximo, sem ser informal demais",
  promocional: "tom de promoção, com senso de urgência e convite a agendar",
};

/**
 * Gera o texto de venda a partir de um serviço/foto usando a IA.
 * Retorna a mensagem pronta para envio no WhatsApp.
 */
export async function gerarMensagemIA(input: GerarMensagemInput): Promise<string> {
  const tomTexto = TOMES[input.tom ?? "profissional"] ?? TOMES.profissional;

  const prompt = `Escreva uma mensagem de venda curta (50-90 palavras, em português brasileiro) que uma clínica ${input.clinica ? `(nome: ${input.clinica})` : "de atendimento de saúde"} enviaria por WhatsApp a um paciente ou lead para oferecer o serviço "${input.servico}".

Os $: ${tomTexto}.

Exija:
- SaudaÃ§ão pessoal curta.
- Apresentação do serviço com 1-2 benefícios concretos.
- Convite claro para agendar/responder.
- ${input.publico ? `Foco no público: ${input.publico}.` : ""}
- Texto natural, sem emojis exagerados, pronto para copiar e colar.
- Termine com "Basta responder esta mensagem para agendar".`;

  const res = await fetch(`${IA_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${IA_API_KEY}`,
    },
    body: JSON.stringify({
      model: IA_MODEL,
      messages: [
        { role: "system", content: "Você escreve mensagens de vendas persuasivas em português brasileiro para clínicas de saúde." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      stream: false, // evita resposta em SSE (data: [DONE]) e garante JSON puro
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`IA erro ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const texto = data.choices?.[0]?.message?.content?.trim();
  if (!texto) throw new Error("IA não retornou texto");
  return texto;
}