import React, { useState } from 'react';
import { Search, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Transaction, FuelEntry, Vehicle } from '../types';
import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { fetchReportData } from '../services/firebase';

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
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      if (filters.tipo === 'combustivel') {
        const fuelData = await fetchReportData('combustivel', filters.inicio, filters.fim) as any[];
        data = fuelData.map(d => ({ ...d, tipo: 'combustivel' }));
      } else if (filters.tipo === 'todos') {
        const transData = await fetchReportData('transacoes', filters.inicio, filters.fim) as any[];
        const fuelData = await fetchReportData('combustivel', filters.inicio, filters.fim) as any[];
        const fuelMapped = fuelData.map(d => ({ ...d, tipo: 'combustivel' }));
        data = [...transData, ...fuelMapped].sort((a, b) => b.data.localeCompare(a.data));
      } else {
        const transData = await fetchReportData('transacoes', filters.inicio, filters.fim) as any[];
        data = transData.filter(t => t.tipo === filters.tipo);
      }
      setReportData(data);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao buscar dados do relatório.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Brand Colors - PZ Transportes
    const primaryColor: [number, number, number] = [255, 193, 7]; // #FFC107 Yellow
    const darkColor: [number, number, number] = [26, 26, 26]; // #1A1A1A Dark
    const emeraldColor: [number, number, number] = [16, 185, 129];
    const roseColor: [number, number, number] = [244, 63, 94];

    // 1. Header with Brand Identity
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setFontSize(28).setTextColor(darkColor[0], darkColor[1], darkColor[2]).setFont('helvetica', 'bold');
    doc.text('PZ TRANSPORTES', 14, 25);
    
    doc.setFontSize(11).setTextColor(darkColor[0], darkColor[1], darkColor[2]).setFont('helvetica', 'bold');
    doc.text('RELATÓRIO GERENCIAL', 14, 35);
    
    doc.setFontSize(10).setTextColor(darkColor[0], darkColor[1], darkColor[2]).setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 28, { align: 'right' });

    // 2. Report Info
    doc.setFontSize(14).setTextColor(darkColor[0], darkColor[1], darkColor[2]).setFont('helvetica', 'bold');
    doc.text('Resumo de Atividades', 14, 60);
    
    doc.setFontSize(10).setTextColor(100, 100, 100).setFont('helvetica', 'normal');
    doc.text(`Período: ${formatDate(filters.inicio)} até ${formatDate(filters.fim)}`, 14, 67);
    doc.text(`Filtro: ${filters.tipo.toUpperCase()}`, 14, 72);

    // 3. Summary Cards
    const incomeVal = reportData.filter(i => i.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const expenseVal = reportData.filter(i => i.tipo === 'saida').reduce((acc, curr) => acc + curr.valor, 0);
    const fuelVal = reportData.filter(i => i.tipo === 'combustivel').reduce((acc, curr) => acc + curr.valor, 0);
    const totalExpense = expenseVal + fuelVal;
    const saldo = incomeVal - totalExpense;
    
    let startY = 115;

    if (filters.tipo === 'todos') {
      // Card 1: Saldo
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 80, 42, 25, 3, 3, 'F');
      doc.setFontSize(8).setTextColor(100, 100, 100).setFont('helvetica', 'bold');
      doc.text('SALDO', 18, 87);
      doc.setFontSize(11).setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(formatCurrency(saldo), 18, 97);

      // Card 2: Entradas
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(60, 80, 42, 25, 3, 3, 'F');
      doc.setFontSize(8).setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
      doc.text('ENTRADAS', 64, 87);
      doc.setFontSize(11).setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
      doc.text(formatCurrency(incomeVal), 64, 97);

      // Card 3: Saídas
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(106, 80, 42, 25, 3, 3, 'F');
      doc.setFontSize(8).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text('SAÍDAS', 110, 87);
      doc.setFontSize(11).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text(formatCurrency(expenseVal), 110, 97);

      // Card 4: Combustível
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(152, 80, 42, 25, 3, 3, 'F');
      doc.setFontSize(8).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text('COMBUSTÍVEL', 156, 87);
      doc.setFontSize(11).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text(formatCurrency(fuelVal), 156, 97);

      // Gráfico de Barras
      doc.setFontSize(12).setTextColor(darkColor[0], darkColor[1], darkColor[2]).setFont('helvetica', 'bold');
      doc.text('Visão Geral (Gráfico)', 14, 125);
      
      const maxVal = Math.max(incomeVal, expenseVal, fuelVal, 1);
      const chartHeight = 40;
      const chartY = 175;
      
      // Entradas Bar
      const h1 = (incomeVal / maxVal) * chartHeight;
      doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
      doc.rect(40, chartY - h1, 30, h1, 'F');
      doc.setFontSize(8).setTextColor(100, 100, 100);
      doc.text('Entradas', 55, chartY + 5, { align: 'center' });
      doc.text(formatCurrency(incomeVal), 55, chartY - h1 - 2, { align: 'center' });

      // Saídas Bar
      const h2 = (expenseVal / maxVal) * chartHeight;
      doc.setFillColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.rect(90, chartY - h2, 30, h2, 'F');
      doc.text('Saídas', 105, chartY + 5, { align: 'center' });
      doc.text(formatCurrency(expenseVal), 105, chartY - h2 - 2, { align: 'center' });

      // Combustível Bar
      const h3 = (fuelVal / maxVal) * chartHeight;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(140, chartY - h3, 30, h3, 'F');
      doc.text('Combustível', 155, chartY + 5, { align: 'center' });
      doc.text(formatCurrency(fuelVal), 155, chartY - h3 - 2, { align: 'center' });

      startY = 195;
    } else {
      // Standard Cards for specific filters
      const totalVal = reportData.reduce((acc, curr) => acc + curr.valor, 0);
      
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 80, 58, 25, 3, 3, 'F');
      doc.setFontSize(8).setTextColor(100, 100, 100).setFont('helvetica', 'bold');
      doc.text('TOTAL MOVIMENTADO', 18, 87);
      doc.setFontSize(12).setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(formatCurrency(totalVal), 18, 97);

      if (filters.tipo === 'entrada') {
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(76, 80, 58, 25, 3, 3, 'F');
        doc.setFontSize(8).setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
        doc.text('TOTAL ENTRADAS', 80, 87);
        doc.setFontSize(12).setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
        doc.text(formatCurrency(incomeVal), 80, 97);
      } else if (filters.tipo === 'saida' || filters.tipo === 'combustivel') {
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(76, 80, 58, 25, 3, 3, 'F');
        doc.setFontSize(8).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.text(filters.tipo === 'combustivel' ? 'TOTAL COMBUSTÍVEL' : 'TOTAL SAÍDAS', 80, 87);
        doc.setFontSize(12).setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.text(formatCurrency(filters.tipo === 'combustivel' ? fuelVal : expenseVal), 80, 97);
      }
    }

    // 4. Detailed Table (Without Currency Symbol as requested)
    const body = reportData.map(item => {
      if (item.tipo === 'combustivel') {
        const v = vehicles.find(v => v.id === item.veiculoId);
        return filters.tipo === 'combustivel' 
          ? [item.data, v?.nome || 'Desconhecido', formatNumber(item.valor)]
          : [item.data, 'COMBUSTÍVEL', v?.nome || 'Desconhecido', formatNumber(item.valor)];
      } else {
        const desc = item.descricao ? item.descricao.toUpperCase() : item.categoria.toUpperCase();
        return filters.tipo === 'todos' 
          ? [item.data, item.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA', desc, formatNumber(item.valor)]
          : [item.data, item.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA', desc, formatNumber(item.valor)];
      }
    });

    const head = filters.tipo === 'combustivel' 
      ? [['DATA', 'VEÍCULO', 'VALOR']]
      : [['DATA', 'TIPO', 'DESCRIÇÃO/VEÍCULO', 'VALOR']];

    autoTable(doc, {
      startY: startY,
      head,
      body,
      theme: 'striped',
      headStyles: { 
        fillColor: darkColor, 
        textColor: primaryColor,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        [head[0].length - 1]: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
      },
      styles: {
        fontSize: 8,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8).setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`relatorio_pz_${filters.inicio}_a_${filters.fim}.pdf`);
  };

  const exportExcel = () => {
    const dataToExport = reportData.map(item => {
      if (item.tipo === 'combustivel') {
        const v = vehicles.find(v => v.id === item.veiculoId);
        return {
          Data: item.data,
          Tipo: 'Combustível',
          'Descrição/Veículo': v?.nome || 'Desconhecido',
          Valor: formatNumber(item.valor)
        };
      } else {
        const desc = item.descricao ? item.descricao.toUpperCase() : item.categoria.toUpperCase();
        return {
          Data: item.data,
          Tipo: item.tipo === 'entrada' ? 'Entrada' : 'Saída',
          'Descrição/Veículo': desc,
          Valor: formatNumber(item.valor)
        };
      }
    });
    const ws = (XLSX as any).utils.json_to_sheet(dataToExport);
    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, 'Relatório');
    (XLSX as any).writeFile(wb, `relatorio_pz_${filters.inicio}_a_${filters.fim}.xlsx`);
  };

  const exportText = () => {
    let content = '';
    reportData.forEach(item => {
      if (item.tipo === 'combustivel') {
        const v = vehicles.find(v => v.id === item.veiculoId);
        content += `${item.data}\tCombustível\t${v?.nome || 'Desconhecido'}   ${formatNumber(item.valor)}\n`;
      } else {
        const tipo = item.tipo === 'entrada' ? 'Entrada' : 'Saída';
        const desc = item.descricao ? item.descricao.toUpperCase() : item.categoria.toUpperCase();
        content += `${item.data}\t${tipo}\t${desc}   ${formatNumber(item.valor)}\n`;
      }
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_pz_${filters.inicio}_a_${filters.fim}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data Início</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={filters.inicio}
              onChange={(e) => setFilters({...filters, inicio: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data Fim</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={filters.fim}
              onChange={(e) => setFilters({...filters, fim: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo de Relatório</label>
            <select 
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateReport}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary-dark text-dark font-black px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              {isLoading ? 'Buscando...' : 'Gerar'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {reportData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap justify-end gap-3">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportPDF}
                className="bg-zinc-800 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <FileDown className="w-4 h-4 text-primary" />
                Exportar PDF
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportText}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <FileText className="w-4 h-4" />
                Exportar TXT
              </motion.button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Data</th>
                      {filters.tipo === 'combustivel' ? (
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Veículo</th>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Tipo</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Descrição/Veículo</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <AnimatePresence>
                      {reportData.map((item, i) => {
                        const desc = item.descricao ? item.descricao.toUpperCase() : item.categoria?.toUpperCase();
                        return (
                          <motion.tr 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-zinc-50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-mono text-zinc-600">{formatDate(item.data)}</td>
                            {filters.tipo === 'combustivel' ? (
                              <td className="px-6 py-4 text-sm font-bold text-zinc-800">
                                {vehicles.find(v => v.id === item.veiculoId)?.nome || 'Desconhecido'}
                              </td>
                            ) : (
                              <>
                                <td className="px-6 py-4 text-sm">
                                  <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    item.tipo === 'entrada' ? "bg-emerald-100 text-emerald-800" : 
                                    item.tipo === 'combustivel' ? "bg-primary/20 text-dark" : "bg-rose-100 text-rose-800"
                                  )}>
                                    {item.tipo === 'combustivel' ? 'Combustível' : item.tipo}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-zinc-800">
                                  {item.tipo === 'combustivel' 
                                    ? vehicles.find(v => v.id === item.veiculoId)?.nome || 'Desconhecido'
                                    : desc}
                                </td>
                              </>
                            )}
                            <td className={cn(
                              "px-6 py-4 text-sm font-black tabular-nums text-right",
                              (item.tipo === 'entrada') ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {formatNumber(item.valor)}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
