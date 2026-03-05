import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface TransactionsProps {
  transactions: Transaction[];
}

export default function Transactions({ transactions }: TransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'entrada',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    categoria: '',
    descricao: ''
  });

  const filteredTransactions = transactions.filter(t => 
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.data.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      valor: parseFloat(formData.valor as string)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'transacoes', editingId), data);
      } else {
        await addDoc(collection(db, 'transacoes'), data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        tipo: 'entrada',
        data: new Date().toISOString().split('T')[0],
        valor: '',
        categoria: '',
        descricao: ''
      });
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Erro ao salvar transação.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta transação?')) {
      await deleteDoc(doc(db, 'transacoes', id));
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      tipo: t.tipo,
      data: t.data,
      valor: t.valor.toString(),
      categoria: t.categoria,
      descricao: t.descricao || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              tipo: 'entrada',
              data: new Date().toISOString().split('T')[0],
              valor: '',
              categoria: '',
              descricao: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-dark font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="data-row-hover group">
                  <td className="px-6 py-4 text-sm text-zinc-600 tabular-nums">{formatDate(t.data)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      t.tipo === 'entrada' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {t.tipo === 'entrada' ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                      {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-800">{t.categoria}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{t.descricao}</td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-bold tabular-nums",
                    t.tipo === 'entrada' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-zinc-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary p-6 flex items-center justify-between">
              <h3 className="font-bold text-dark text-lg">{editingId ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark/60 hover:text-dark transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'entrada' | 'saida'})}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Venda de Areia, Manutenção"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark rounded-xl font-bold text-dark transition-colors shadow-lg shadow-primary/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
