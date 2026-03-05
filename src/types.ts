export interface Vehicle {
  id: string;
  nome: string;
  placa: string;
}

export interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  data: string;
  valor: number;
  categoria: string;
  descricao?: string;
}

export interface FuelEntry {
  id: string;
  veiculoId: string;
  data: string;
  valor: number;
}

export type TabType = 'dashboard' | 'transacoes' | 'combustivel' | 'veiculos' | 'relatorios';
