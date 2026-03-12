import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

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
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
          className="bg-primary hover:bg-primary-dark text-dark font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </motion.button>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-white">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <AnimatePresence>
                {filteredTransactions.map((t, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    key={t.id} 
                    className="hover:bg-zinc-50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-zinc-600">{formatDate(t.data)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        t.tipo === 'entrada' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {t.tipo === 'entrada' ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                        {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-800">{t.categoria}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{t.descricao}</td>
                    <td className={cn(
                      "px-6 py-4 text-sm font-black tabular-nums",
                      t.tipo === 'entrada' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {formatCurrency(t.valor)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(t)} className="p-2 text-zinc-400 hover:text-primary transition-colors bg-white rounded-lg shadow-sm border border-zinc-100">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors bg-white rounded-lg shadow-sm border border-zinc-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-dark p-6 flex items-center justify-between text-white">
                <h3 className="font-bold text-lg">{editingId ? 'Editar Transação' : 'Nova Transação'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo</label>
                    <select 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as 'entrada' | 'saida'})}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={formData.data}
                      onChange={(e) => setFormData({...formData, data: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Venda de Areia, Manutenção"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary hover:bg-primary-dark rounded-2xl font-black text-dark transition-all shadow-lg shadow-primary/20"
                  >
                    {editingId ? 'Atualizar Transação' : 'Salvar Transação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
