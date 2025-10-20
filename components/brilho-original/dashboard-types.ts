// Adicionar declaração de tipo para as funções globais
export {}; // Torna este arquivo um módulo externo

declare global {
  interface Window {
    dashboardHelpers?: {
      fetchBrandData: (idUnico: string) => Promise<void>;
      getIdUnico: () => string | null;
    };
  }
}
