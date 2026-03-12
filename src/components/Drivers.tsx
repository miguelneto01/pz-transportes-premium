import React, { useState } from 'react';
import { Users, Plus, Phone, CreditCard, UserCheck, UserX, UserMinus, X } from 'lucide-react';
import { Driver } from '../types';
import { cn } from '../lib/utils';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface DriversProps {
  drivers: Driver[];
}

export default function Drivers({ drivers }: DriversProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    nome: '',
    cnh: '',
    telefone: '',
    status: 'ativo' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'motoristas'), newDriver);
      setIsModalOpen(false);
      setNewDriver({
        nome: '',
        cnh: '',
        telefone: '',
        status: 'ativo'
      });
    } catch (error) {
      console.error("Erro ao adicionar motorista:", error);
    }
  };

  const updateStatus = async (driverId: string, status: Driver['status']) => {
    try {
      const driverRef = doc(db, 'motoristas', driverId);
      await updateDoc(driverRef, { status });
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
          <h3 className="text-2xl font-bold text-zinc-800">Gestão de Motoristas</h3>
          <p className="text-zinc-500">Controle sua equipe de condutores</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Novo Motorista
        </motion.button>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {drivers.map((driver) => (
            <motion.div 
              key={driver.id} 
              variants={itemVariants}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-100 p-4 rounded-2xl group-hover:bg-primary/10 transition-colors">
                  <Users className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  driver.status === 'ativo' ? "bg-emerald-50 text-emerald-600" : 
                  driver.status === 'ferias' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                )}>
                  {driver.status}
                </span>
              </div>
              
              <h4 className="text-lg font-bold text-zinc-800 mb-4">{driver.nome}</h4>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-zinc-500">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">CNH: {driver.cnh}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{driver.telefone}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-zinc-100">
                <button 
                  onClick={() => updateStatus(driver.id, 'ativo')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    driver.status === 'ativo' ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                  )}
                >
                  Ativo
                </button>
                <button 
                  onClick={() => updateStatus(driver.id, 'ferias')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    driver.status === 'ferias' ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                  )}
                >
                  Férias
                </button>
                <button 
                  onClick={() => updateStatus(driver.id, 'afastado')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    driver.status === 'afastado' ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                  )}
                >
                  Afastado
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
                <h3 className="text-xl font-bold">Novo Motorista</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newDriver.nome}
                    onChange={(e) => setNewDriver({...newDriver, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CNH</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newDriver.cnh}
                    onChange={(e) => setNewDriver({...newDriver, cnh: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newDriver.telefone}
                    onChange={(e) => setNewDriver({...newDriver, telefone: e.target.value})}
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 mt-2"
                >
                  Cadastrar Motorista
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
