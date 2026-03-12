export interface Vehicle {
  id: string;
  nome: string;
  placa: string;
  motoristaId?: string;
}

export interface Driver {
  id: string;
  nome: string;
  cnh: string;
  telefone: string;
  status: 'ativo' | 'ferias' | 'afastado';
}

export interface Maintenance {
  id: string;
  veiculoId: string;
  tipo: string;
  data: string;
  km?: number;
  valor: number;
  status: 'pendente' | 'concluida';
  proximaKm?: number;
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

export type TabType = 'dashboard' | 'transacoes' | 'combustivel' | 'veiculos' | 'manutencao' | 'motoristas' | 'relatorios';
