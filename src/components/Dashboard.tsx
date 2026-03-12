import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Fuel, Calculator, Percent, Wrench, Users, AlertCircle } from 'lucide-react';
import { Transaction, FuelEntry, Vehicle, Maintenance } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, subDays, format } from 'date-fns';
import { motion } from 'motion/react';

interface DashboardProps {
  transactions: Transaction[];
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
  maintenances: Maintenance[];
}

export default function Dashboard({ transactions, fuelEntries, vehicles, maintenances }: DashboardProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filter current month data
  const currentMonthTransactions = transactions.filter(t => 
    isWithinInterval(parseISO(t.data), { start: monthStart, end: monthEnd })
  );
  const currentMonthFuel = fuelEntries.filter(f => 
    isWithinInterval(parseISO(f.data), { start: monthStart, end: monthEnd })
  );

  const income = currentMonthTransactions
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);
  
  const operationalExpenses = currentMonthTransactions
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + t.valor, 0);
  
  const fuelExpenses = currentMonthFuel.reduce((acc, f) => acc + f.valor, 0);
  
  const totalExpenses = operationalExpenses + fuelExpenses;
  const balance = income - totalExpenses;
  const profitMargin = income > 0 ? (balance / income) * 100 : 0;

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(now, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayIncome = transactions
      .filter(t => t.data === dateStr && t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
    const dayExpense = transactions
      .filter(t => t.data === dateStr && t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
    const dayFuel = fuelEntries
      .filter(f => f.data === dateStr)
      .reduce((acc, f) => acc + f.valor, 0);
    
    return {
      name: format(date, 'dd/MM'),
      entradas: dayIncome,
      saidas: dayExpense + dayFuel
    };
  });

  // Fuel by vehicle data
  const fuelByVehicle = vehicles.map(v => ({
    name: v.nome,
    valor: currentMonthFuel
      .filter(f => f.veiculoId === v.id)
      .reduce((acc, f) => acc + f.valor, 0)
  })).filter(v => v.valor > 0);

  const stats = [
    { label: 'Saldo Mensal', value: balance, icon: Wallet, color: balance >= 0 ? 'text-emerald-600' : 'text-rose-600', trend: '+12.5%' },
    { label: 'Entradas', value: income, icon: TrendingUp, color: 'text-emerald-600', trend: '+8.2%' },
    { label: 'Saídas Totais', value: totalExpenses, icon: TrendingDown, color: 'text-rose-600', trend: '-2.4%' },
    { label: 'Combustível', value: fuelExpenses, icon: Fuel, color: 'text-primary-dark', trend: '+5.1%' },
    { label: 'Margem de Lucro', value: `${profitMargin.toFixed(1)}%`, icon: Percent, color: 'text-zinc-700', trend: '+1.2%' },
    { label: 'Média Diária', value: income / 30, icon: Calculator, color: 'text-zinc-700', trend: '+0.5%' },
  ];

  const topVehicle = [...fuelByVehicle].sort((a, b) => b.valor - a.valor)[0];
  const pendingMaintenances = maintenances.filter(m => m.status === 'pendente');

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
      className="space-y-8"
    >
      {/* Modern Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl shadow-dark/20">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Painel de Gestão</h2>
          <p className="text-white/60 font-medium">Controle total da sua frota e finanças em tempo real.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Status da Frota</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">{vehicles.length} Veículos Ativos</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                <stat.icon className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>
              {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Fluxo de Caixa (7 dias)
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-zinc-500">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-zinc-500">Saídas</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={3} />
                <Area type="monotone" dataKey="saidas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Info Panel */}
        <div className="space-y-6">
          {/* Maintenance Alerts */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Manutenções
              </h4>
              <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingMaintenances.length} PENDENTES
              </span>
            </div>
            <div className="space-y-3">
              {pendingMaintenances.slice(0, 3).map(m => (
                <div key={m.id} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-800">{m.tipo}</p>
                    <p className="text-[10px] text-zinc-500">{vehicles.find(v => v.id === m.veiculoId)?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400">{formatDate(m.data)}</p>
                  </div>
                </div>
              ))}
              {pendingMaintenances.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-zinc-400 italic">Nenhuma manutenção pendente</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Vehicle Card */}
          <motion.div variants={itemVariants} className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-dark/60 text-xs font-bold uppercase tracking-widest mb-1">Maior Consumo (Mês)</h4>
              {topVehicle ? (
                <>
                  <p className="text-xl font-black text-dark mb-4">{topVehicle.name}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-black text-dark">{formatCurrency(topVehicle.valor)}</p>
                    <div className="p-3 bg-dark rounded-2xl">
                      <Fuel className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-dark/40 font-bold italic">Nenhum dado este mês</p>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>

          {/* Quick Insights */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h4 className="text-sm font-bold text-zinc-800 mb-4 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Insights
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800">Receita em Alta</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Suas entradas cresceram 8% este mês.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-50 rounded-lg">
                  <Fuel className="w-3 h-3 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800">Alerta de Gastos</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Combustível representa 42% das saídas.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
