export type ClinicSpecialty =
  | "Odontologia"
  | "Estética Avançada"
  | "Dermatologia"
  | "Fisioterapia"
  | "Psicologia";

export type ClinicStatus = "ativa" | "trial" | "inadimplente" | "suspensa";

export interface Clinic {
  id: string;
  name: string;
  specialty: ClinicSpecialty;
  patients: number;
  description: string;
  status: ClinicStatus;
  mrr: number;
  whatsappSessions: number;
  createdAt: string;
}

export const clinicsMock: Clinic[] = [
  {
    id: "cln_001",
    name: "Odonto Pró Campinas",
    specialty: "Odontologia",
    patients: 182,
    description:
      "Utilizando funil de Implantes e Ortodontia integrado ao disparador de confirmações de consulta.",
    status: "ativa",
    mrr: 497,
    whatsappSessions: 2,
    createdAt: "2025-11-02",
  },
  {
    id: "cln_002",
    name: "Clínica Slim Body",
    specialty: "Estética Avançada",
    patients: 94,
    description:
      "Funil de captação para Harmonização Facial e Botox com automação pós-procedimento.",
    status: "ativa",
    mrr: 397,
    whatsappSessions: 1,
    createdAt: "2026-01-14",
  },
  {
    id: "cln_003",
    name: "Derme & Saúde RMC",
    specialty: "Dermatologia",
    patients: 310,
    description:
      "Controle completo de prontuários com alertas integrados para recorrência anual.",
    status: "ativa",
    mrr: 697,
    whatsappSessions: 3,
    createdAt: "2025-08-22",
  },
  {
    id: "cln_004",
    name: "Vitalis Fisio Center",
    specialty: "Fisioterapia",
    patients: 128,
    description:
      "Agendamento recorrente com lembretes automatizados e controle de pacotes de sessões.",
    status: "trial",
    mrr: 0,
    whatsappSessions: 1,
    createdAt: "2026-06-05",
  },
  {
    id: "cln_005",
    name: "Espaço Mente Sã",
    specialty: "Psicologia",
    patients: 67,
    description:
      "Confirmação de sessões e cobrança recorrente via PIX com integração ao financeiro.",
    status: "inadimplente",
    mrr: 297,
    whatsappSessions: 1,
    createdAt: "2025-12-11",
  },
];

export const saasMetrics = {
  mrr: 18740,
  arr: 224880,
  activeTenants: 42,
  churnRate: 2.4,
  overdueRate: 5.1,
  whatsappSessions: 71,
  messagesLast24h: 12480,
  apiStatus: "online" as const,
};
