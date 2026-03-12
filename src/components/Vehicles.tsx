import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, User, X } from 'lucide-react';
import { Vehicle, Driver } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface VehiclesProps {
  vehicles: Vehicle[];
  drivers: Driver[];
}

export default function Vehicles({ vehicles, drivers }: VehiclesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    placa: '',
    motoristaId: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'veiculos', editingId), formData);
      } else {
        await addDoc(collection(db, 'veiculos'), formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nome: '', placa: '', motoristaId: '' });
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Erro ao salvar veículo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este veículo?')) {
      await deleteDoc(doc(db, 'veiculos', id));
    }
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormData({ nome: v.nome, placa: v.placa, motoristaId: v.motoristaId || '' });
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-zinc-800">Frota de Veículos</h3>
          <p className="text-zinc-500">Gerencie os caminhões e motoristas vinculados</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingId(null);
            setFormData({ nome: '', placa: '', motoristaId: '' });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Novo Veículo
        </motion.button>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {vehicles.map((v) => {
            const driver = drivers.find(d => d.id === v.motoristaId);
            return (
              <motion.div 
                key={v.id} 
                variants={itemVariants}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-zinc-50 rounded-2xl text-primary-dark group-hover:bg-primary/10 transition-colors">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(v)} className="p-2 text-zinc-400 hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-black text-zinc-800 text-xl mb-1">{v.nome}</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest mb-6">{v.placa}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Motorista</p>
                      <p className="text-sm font-bold text-zinc-700">{driver?.nome || 'Nenhum vinculado'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">ID: {v.id.substring(0, 8)}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-dark p-6 flex items-center justify-between text-white">
                <h3 className="font-bold text-lg">{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Veículo</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Scania R450"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Placa</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ABC-1234"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Motorista Responsável</label>
                  <select 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.motoristaId}
                    onChange={(e) => setFormData({...formData, motoristaId: e.target.value})}
                  >
                    <option value="">Nenhum vinculado</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 bg-primary hover:bg-primary-dark rounded-2xl font-black text-dark transition-all shadow-lg shadow-primary/20"
                  >
                    {editingId ? 'Atualizar Veículo' : 'Salvar Veículo'}
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
