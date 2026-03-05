import React, { useState } from 'react';
import { Search, FileDown, FileSpreadsheet } from 'lucide-react';
import { Transaction, FuelEntry, Vehicle } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// @ts-ignore
const jsPDFConstructor = jsPDF.jsPDF || jsPDF;

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportsProps {
  transactions: Transaction[];
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
}

export default function Reports({ transactions, fuelEntries, vehicles }: ReportsProps) {
  const [filters, setFilters] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
    tipo: 'todos'
  });

  const [reportData, setReportData] = useState<any[]>([]);

  const generateReport = () => {
    let data: any[] = [];
    if (filters.tipo === 'combustivel') {
      data = fuelEntries.filter(f => f.data >= filters.inicio && f.data <= filters.fim);
    } else {
      data = transactions.filter(t => t.data >= filters.inicio && t.data <= filters.fim);
      if (filters.tipo !== 'todos') {
        data = data.filter(t => t.tipo === filters.tipo);
      }
    }
    setReportData(data);
  };

  const exportPDF = () => {
    const doc = new (jsPDFConstructor as any)();
    doc.setFontSize(18).setTextColor(255, 193, 7).text('PZ Transportes', 14, 20);
    doc.setFontSize(12).setTextColor(0, 0, 0).text(`Relatório: ${filters.inicio} a ${filters.fim} (${filters.tipo})`, 14, 30);

    const body = reportData.map(item => {
      if (filters.tipo === 'combustivel') {
        const v = vehicles.find(v => v.id === item.veiculoId);
        return [formatDate(item.data), v?.nome || 'Desconhecido', formatCurrency(item.valor)];
      } else {
        return [formatDate(item.data), item.tipo === 'entrada' ? 'Entrada' : 'Saída', item.categoria, item.descricao || '', formatCurrency(item.valor)];
      }
    });

    const head = filters.tipo === 'combustivel' 
      ? [['Data', 'Veículo', 'Valor']]
      : [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']];

    doc.autoTable({
      startY: 40,
      head,
      body,
      headStyles: { fillColor: [26, 26, 26] }
    });

    doc.save(`relatorio_${filters.inicio}_a_${filters.fim}.pdf`);
  };

  const exportExcel = () => {
    const ws = (XLSX as any).utils.json_to_sheet(reportData);
    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, 'Relatório');
    (XLSX as any).writeFile(wb, `relatorio_${filters.inicio}_a_${filters.fim}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data Início</label>
            <input 
              type="date" 
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={filters.inicio}
              onChange={(e) => setFilters({...filters, inicio: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data Fim</label>
            <input 
              type="date" 
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={filters.fim}
              onChange={(e) => setFilters({...filters, fim: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo de Relatório</label>
            <select 
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={filters.tipo}
              onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
              <option value="combustivel">Combustível</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={generateReport}
              className="flex-1 bg-primary hover:bg-primary-dark text-dark font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Search className="w-4 h-4" />
              Gerar
            </button>
          </div>
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-end gap-2">
            <button 
              onClick={exportPDF}
              className="bg-zinc-800 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </button>
            <button 
              onClick={exportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                    {filters.tipo === 'combustivel' ? (
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Veículo</th>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {reportData.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-600">{formatDate(item.data)}</td>
                      {filters.tipo === 'combustivel' ? (
                        <td className="px-6 py-4 text-sm font-medium text-zinc-800">
                          {vehicles.find(v => v.id === item.veiculoId)?.nome || 'Desconhecido'}
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              item.tipo === 'entrada' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-800">{item.categoria}</td>
                        </>
                      )}
                      <td className={cn(
                        "px-6 py-4 text-sm font-bold tabular-nums",
                        (item.tipo === 'entrada') ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {formatCurrency(item.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
