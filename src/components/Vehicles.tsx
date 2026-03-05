import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import { Vehicle } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface VehiclesProps {
  vehicles: Vehicle[];
}

export default function Vehicles({ vehicles }: VehiclesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    placa: ''
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
      setFormData({ nome: '', placa: '' });
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
    setFormData({ nome: v.nome, placa: v.placa });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ nome: '', placa: '' });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-dark font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Veículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-zinc-50 rounded-xl text-primary-dark">
                <Truck className="w-6 h-6" />
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
            <h3 className="font-bold text-zinc-800 text-lg mb-1">{v.nome}</h3>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{v.placa}</p>
            
            <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ID Interno</span>
              <span className="text-xs font-mono text-zinc-400">{v.id.substring(0, 8)}...</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary p-6 flex items-center justify-between">
              <h3 className="font-bold text-dark text-lg">{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark/60 hover:text-dark transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome do Veículo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Caminhão Areia 01"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Placa</label>
                <input 
                  type="text" 
                  required
                  placeholder="ABC-1234"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.placa}
                  onChange={(e) => setFormData({...formData, placa: e.target.value})}
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
