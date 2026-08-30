export interface ProvaRegistro {
  id: string;
  data: string;
  nota: number;
  acertos: number;
  total: number;
  tempoSegundos: number;
  aprovado: boolean;
}

const STORAGE_KEY = "@cornetas_app_historico_v1";

export function getHistoricoProvas(): ProvaRegistro[] {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as ProvaRegistro[]) : [];
  } catch {
    return [];
  }
}

export function salvarProva(registro: Omit<ProvaRegistro, "id">): void {
  if (typeof window === "undefined") return;
  try {
    const novo: ProvaRegistro = { ...registro, id: crypto.randomUUID?.() ?? String(Date.now()) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([novo, ...getHistoricoProvas()].slice(0, 30)));
  } catch (error) {
    console.error("Erro ao salvar histórico", error);
  }
}
