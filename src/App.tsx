/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Fuel, 
  Truck, 
  FileText, 
  Plus, 
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Menu,
  X,
  Wrench,
  Users
} from 'lucide-react';
import { subscribeToCollection, subscribeToVeiculos } from './services/firebase';
import { Transaction, FuelEntry, Vehicle, TabType, Maintenance, Driver } from './types';
import { cn, formatCurrency } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import FuelControl from './components/FuelControl';
import Vehicles from './components/Vehicles';
import Reports from './components/Reports';
import MaintenanceControl from './components/Maintenance';
import Drivers from './components/Drivers';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubTrans = subscribeToCollection('transacoes', (data) => setTransactions(data as Transaction[]));
    const unsubFuel = subscribeToCollection('combustivel', (data) => setFuelEntries(data as FuelEntry[]));
    const unsubVehicles = subscribeToVeiculos((data) => setVehicles(data as Vehicle[]));
    const unsubMaint = subscribeToCollection('manutencoes', (data) => setMaintenances(data as Maintenance[]));
    const unsubDrivers = subscribeToCollection('motoristas', (data) => setDrivers(data as Driver[]));

    return () => {
      unsubTrans();
      unsubFuel();
      unsubVehicles();
      unsubMaint();
      unsubDrivers();
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
    { id: 'combustivel', label: 'Combustível', icon: Fuel },
    { id: 'veiculos', label: 'Veículos', icon: Truck },
    { id: 'motoristas', label: 'Motoristas', icon: Users },
    { id: 'manutencao', label: 'Manutenção', icon: Wrench },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-dark text-white transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-primary p-2 rounded-lg">
            <Truck className="text-dark w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-bold text-lg leading-tight tracking-tight text-white">PZ TRANSPORTES</span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-widest opacity-80">Gestão de Frota</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "w-full flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group",
                isSidebarOpen ? "px-4" : "justify-center px-0",
                activeTab === tab.id 
                  ? "bg-primary text-dark font-semibold shadow-lg shadow-primary/20" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <tab.icon className={cn("w-5 h-5 shrink-0", activeTab === tab.id ? "text-dark" : "group-hover:text-white")} />
              {isSidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-800 capitalize">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Status do Sistema</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Conectado ao Firebase
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  transactions={transactions} 
                  fuelEntries={fuelEntries} 
                  vehicles={vehicles}
                  maintenances={maintenances}
                />
              )}
              {activeTab === 'transacoes' && (
                <Transactions transactions={transactions} />
              )}
              {activeTab === 'combustivel' && (
                <FuelControl fuelEntries={fuelEntries} vehicles={vehicles} />
              )}
              {activeTab === 'veiculos' && (
                <Vehicles vehicles={vehicles} drivers={drivers} />
              )}
              {activeTab === 'motoristas' && (
                <Drivers drivers={drivers} />
              )}
              {activeTab === 'manutencao' && (
                <MaintenanceControl maintenances={maintenances} vehicles={vehicles} />
              )}
              {activeTab === 'relatorios' && (
                <Reports 
                  transactions={transactions} 
                  fuelEntries={fuelEntries} 
                  vehicles={vehicles} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
