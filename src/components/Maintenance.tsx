import React, { useState } from 'react';
import { Wrench, Plus, Calendar, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { Maintenance, Vehicle } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
}

export default function MaintenanceControl({ maintenances, vehicles }: MaintenanceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMaint, setNewMaint] = useState({
    veiculoId: '',
    tipo: '',
    data: new Date().toISOString().split('T')[0],
    km: 0,
    valor: 0,
    status: 'pendente' as const,
    proximaKm: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'manutencoes'), newMaint);
      setIsModalOpen(false);
      setNewMaint({
        veiculoId: '',
        tipo: '',
        data: new Date().toISOString().split('T')[0],
        km: 0,
        valor: 0,
        status: 'pendente',
        proximaKm: 0
      });
    } catch (error) {
      console.error("Erro ao adicionar manutenção:", error);
    }
  };

  const toggleStatus = async (maint: Maintenance) => {
    try {
      const maintRef = doc(db, 'manutencoes', maint.id);
      await updateDoc(maintRef, {
        status: maint.status === 'pendente' ? 'concluida' : 'pendente'
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
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
          <h3 className="text-2xl font-bold text-zinc-800">Controle de Manutenção</h3>
          <p className="text-zinc-500">Gerencie revisões e preventivas da sua frota</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nova Manutenção
        </motion.button>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Stats */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4 transition-all">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pendentes</p>
            <p className="text-2xl font-black text-zinc-800">{maintenances.filter(m => m.status === 'pendente').length}</p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4 transition-all">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Concluídas</p>
            <p className="text-2xl font-black text-zinc-800">{maintenances.filter(m => m.status === 'concluida').length}</p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4 transition-all">
          <div className="bg-rose-100 p-3 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Custo Total</p>
            <p className="text-2xl font-black text-zinc-800">
              {formatCurrency(maintenances.reduce((acc, curr) => acc + curr.valor, 0))}
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Veículo</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Serviço</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <AnimatePresence>
                {maintenances.map((m) => (
                  <motion.tr 
                    key={m.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4 text-zinc-500" />
                        </div>
                        <span className="font-bold text-zinc-800">
                          {vehicles.find(v => v.id === m.veiculoId)?.nome || 'Desconhecido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{m.tipo}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{formatDate(m.data)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-800">{formatCurrency(m.valor)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        m.status === 'concluida' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleStatus(m)}
                        className="text-zinc-400 hover:text-primary transition-colors"
                      >
                        <CheckCircle2 className={cn("w-5 h-5", m.status === 'concluida' && "text-emerald-500")} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-dark p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Nova Manutenção</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Veículo</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newMaint.veiculoId}
                    onChange={(e) => setNewMaint({...newMaint, veiculoId: e.target.value})}
                  >
                    <option value="">Selecione um veículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.nome} ({v.placa})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo de Serviço</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Troca de Óleo, Pneus..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newMaint.tipo}
                    onChange={(e) => setNewMaint({...newMaint, tipo: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={newMaint.data}
                      onChange={(e) => setNewMaint({...newMaint, data: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={newMaint.valor}
                      onChange={(e) => setNewMaint({...newMaint, valor: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">KM Atual</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={newMaint.km}
                      onChange={(e) => setNewMaint({...newMaint, km: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Próxima KM</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={newMaint.proximaKm}
                      onChange={(e) => setNewMaint({...newMaint, proximaKm: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 mt-2"
                >
                  Salvar Manutenção
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Truck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )
}
