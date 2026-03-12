import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Fuel, X } from 'lucide-react';
import { FuelEntry, Vehicle } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface FuelControlProps {
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
}

export default function FuelControl({ fuelEntries, vehicles }: FuelControlProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    veiculoId: '',
    data: new Date().toISOString().split('T')[0],
    valor: ''
  });

  const filteredEntries = fuelEntries.filter(entry => {
    const vehicle = vehicles.find(v => v.id === entry.veiculoId);
    return vehicle?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || entry.data.includes(searchTerm);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      valor: parseFloat(formData.valor as string)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'combustivel', editingId), data);
      } else {
        await addDoc(collection(db, 'combustivel'), data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        veiculoId: '',
        data: new Date().toISOString().split('T')[0],
        valor: ''
      });
    } catch (error) {
      console.error("Error saving fuel entry:", error);
      alert("Erro ao salvar abastecimento.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este abastecimento?')) {
      await deleteDoc(doc(db, 'combustivel', id));
    }
  };

  const openEdit = (entry: FuelEntry) => {
    setEditingId(entry.id);
    setFormData({
      veiculoId: entry.veiculoId,
      data: entry.data,
      valor: entry.valor.toString()
    });
    setIsModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingId(null);
            setFormData({
              veiculoId: '',
              data: new Date().toISOString().split('T')[0],
              valor: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-dark font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Abastecimento
        </motion.button>

        <motion.div variants={itemVariants} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por veículo ou data..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Veículo</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <AnimatePresence>
                {filteredEntries.map((entry) => {
                  const vehicle = vehicles.find(v => v.id === entry.veiculoId);
                  return (
                    <motion.tr 
                      key={entry.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="data-row-hover group"
                    >
                      <td className="px-6 py-4 text-sm text-zinc-600 tabular-nums">{formatDate(entry.data)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-zinc-100 rounded text-zinc-500">
                            <Fuel className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-zinc-800">{vehicle?.nome || 'Desconhecido'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600 tabular-nums">
                        {formatCurrency(entry.valor)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(entry)} 
                            className="p-1.5 text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(entry.id)} 
                            className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-6 flex items-center justify-between">
                <h3 className="font-bold text-dark text-lg">{editingId ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-dark/60 hover:text-dark transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Veículo</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.veiculoId}
                    onChange={(e) => setFormData({...formData, veiculoId: e.target.value})}
                  >
                    <option value="">Selecione um veículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.nome} ({v.placa})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="pt-4 flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark rounded-xl font-bold text-dark transition-colors shadow-lg shadow-primary/20"
                  >
                    Salvar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
