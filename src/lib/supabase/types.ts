// Tipos de banco do Supabase (definidos manualmente para o schema do crm-base)
// Em produção, gere com: supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          descricao: string | null;
          especialidade: string | null;
          status: string;
          logo_url: string | null;
          cor_primaria: string;
          cor_segundaria: string | null;
          dominio: string | null;
          plano: string;
          mrr: number | null;
          waha_sessao: string | null;
          whatsapp_sessions: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      pacientes: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          telefone: string | null;
          email: string | null;
          nascimento: string | null;
          observacoes: string | null;
          cpf: string | null;
          genero: string | null;
          endereco: string | null;
          origem: string | null;
          ultima_consulta: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      agendamentos: {
        Row: {
          id: string;
          tenant_id: string;
          paciente_id: string | null;
          procedimento_id: string | null;
          profissional_id: string | null;
          valor: number | null;
          data: string;
          tipo: string | null;
          status: string;
          observacoes: string | null;
          created_at: string;
        };
      };
      profissionais: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          especialidade: string | null;
          ativo: boolean;
          created_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          email: string;
          cargo: string;
          ativo: boolean;
          created_at: string;
        };
      };
    };
  };
}
