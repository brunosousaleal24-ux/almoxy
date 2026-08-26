import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Product, StockMovement, StockAlert } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

// 1. Export Products / Inventory to Excel
export function exportInventoryToExcel(products: Product[], companyName = 'Borges & Gomes Engenharia') {
  const data = products.map((p) => {
    const totalValuation = p.currentStock * p.costPrice;
    let statusText = 'Normal';
    if (p.currentStock === 0) statusText = 'Esgotado / Ruptura';
    else if (p.currentStock <= p.safetyStock) statusText = 'Estoque Crítico';
    else if (p.currentStock <= p.minStock) statusText = 'Estoque Baixo';

    return {
      'Código SKU': p.sku,
      'Código de Barras': p.barcode,
      'Nome do Produto': p.name,
      'Categoria': p.category,
      'Unidade': p.unit,
      'Qtd Atual': p.currentStock,
      'Estoque Mínimo': p.minStock,
      'Estoque Máximo': p.maxStock,
      'Status': statusText,
      'Custo Unitário (R$)': p.costPrice,
      'Valor Total em Estoque (R$)': totalValuation,
      'Localização': `${p.location.warehouse} | ${p.location.shelf} | ${p.location.level}`,
      'Fornecedor Principal': p.supplierName,
      'Última Movimentação': formatDate(p.lastMovementDate),
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque Central');

  // Add auto-width column calculation
  const colWidths = Object.keys(data[0] || {}).map((k) => ({
    wch: Math.max(k.length, 16),
  }));
  ws['!cols'] = colWidths;

  const fileName = `Borges_e_Gomes_Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 2. Export Movements (Daily/Period) to Excel
export function exportMovementsToExcel(movements: StockMovement[], title = 'Relatorio_Movimentacoes') {
  const data = movements.map((m) => ({
    'ID Registro': m.id,
    'Data/Hora': formatDate(m.timestamp),
    'Tipo': m.type,
    'Motivo': m.reason,
    'SKU': m.productSku,
    'Produto': m.productName,
    'Quantidade': m.quantity,
    'Estoque Anterior': m.previousStock,
    'Estoque Resultante': m.newStock,
    'Custo Unitário (R$)': m.unitCost,
    'Valor Total (R$)': m.totalCost,
    'Documento / NF': m.documentNumber || '-',
    'Setor Requisitante': m.requesterSector || '-',
    'Operador Responsável': m.operatorName,
    'Observações': m.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');

  const fileName = `Borges_e_Gomes_${title}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 3. Export Daily & Comprehensive Movement Report to PDF
export function exportMovementsToPDF(
  movements: StockMovement[],
  periodTitle = 'Relatório Diário de Movimentação de Almoxarifado',
  companyName = 'BORGES & GOMES ENGENHARIA'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background Deep Slate
  doc.setFillColor(14, 23, 38);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold Accent Stripe
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Title & Company
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text(`ALMOXARIFADO & GESTÃO LOGÍSTICA DE OBRAS | ${periodTitle}`, 14, 19);

  const issueDate = new Date().toLocaleString('pt-BR');
  doc.setTextColor(203, 213, 225);
  doc.text(`Data de Emissão: ${issueDate}`, pageWidth - 14, 19, { align: 'right' });

  // Summary Metrics Bar
  const totalEntradas = movements.filter((m) => m.type === 'ENTRADA');
  const totalSaidas = movements.filter((m) => m.type === 'SAIDA');
  const sumEntradas = totalEntradas.reduce((acc, m) => acc + m.totalCost, 0);
  const sumSaidas = totalSaidas.reduce((acc, m) => acc + m.totalCost, 0);

  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 32, pageWidth - 28, 14, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`REGISTROS: ${movements.length}`, 18, 41);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`ENTRADAS: ${totalEntradas.length} reg. (${formatCurrency(sumEntradas)})`, 75, 41);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text(`SAÍDAS: ${totalSaidas.length} reg. (${formatCurrency(sumSaidas)})`, 155, 41);
  doc.setTextColor(30, 41, 59);
  doc.text(`SALDO PERÍODO: ${formatCurrency(sumEntradas - sumSaidas)}`, 230, 41);

  // Table Body
  const tableData = movements.map((m) => [
    formatDate(m.timestamp),
    m.type,
    m.productSku,
    m.productName.length > 32 ? m.productName.slice(0, 30) + '...' : m.productName,
    m.quantity.toString(),
    formatCurrency(m.unitCost),
    formatCurrency(m.totalCost),
    m.documentNumber || '-',
    m.requesterSector || '-',
    m.operatorName,
  ]);

  autoTable(doc, {
    startY: 50,
    head: [
      [
        'Data/Hora',
        'Tipo',
        'SKU',
        'Produto / Material',
        'Qtd',
        'Custo Unit.',
        'Valor Total',
        'Doc / NF / OS',
        'Setor Requisitante',
        'Responsável',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 34, 53],
      textColor: [245, 158, 11],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 22 },
      3: { cellWidth: 55 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 22 },
      8: { cellWidth: 35 },
      9: { cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        if (data.cell.raw === 'ENTRADA') {
          data.cell.styles.textColor = [22, 163, 74];
        } else if (data.cell.raw === 'SAIDA') {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (data.cell.raw === 'AJUSTE') {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      // Footer
      const str = `Borges & Gomes Engenharia | Almoxarifado Central - Relatório Oficial de Conformidade | Pág. ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 14, doc.internal.pageSize.getHeight() - 8);
    },
  });

  const fileName = `Borges_e_Gomes_Relatorio_Movimentacoes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// 4. Export Critical Low Stock & Reorder PDF
export function exportLowStockReportPDF(alerts: StockAlert[], products: Product[], companyName = 'BORGES & GOMES ENGENHARIA') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(185, 28, 28); // red-700
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 22, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${companyName.toUpperCase()} - ALERTA DE REPOSIÇÃO & ESTOQUE CRÍTICO`, 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 226, 226);
  doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')} | Total de Itens em Atenção: ${alerts.length}`, 14, 18);

  const totalEstimatedCost = alerts.reduce((acc, a) => acc + a.estimatedCost, 0);

  const tableData = alerts.map((a) => {
    const prod = products.find((p) => p.id === a.productId);
    return [
      a.productSku,
      a.productName,
      a.type === 'CRITICO' ? 'CRÍTICO (0)' : 'BAIXO',
      a.currentStock.toString(),
      a.minStock.toString(),
      a.suggestedReorderQuantity.toString(),
      prod ? prod.supplierName : '-',
      formatCurrency(a.estimatedCost),
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [
      [
        'SKU',
        'Produto / Material',
        'Gravidade',
        'Qtd Atual',
        'Est. Mín.',
        'Sugerido Comprar',
        'Fornecedor Homologado',
        'Custo Est.',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, fontStyle: 'bold' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 32 },
      7: { cellWidth: 24, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    foot: [
      ['', 'VALOR TOTAL ESTIMADO DE COMPRA RECOMENDADA:', '', '', '', '', '', formatCurrency(totalEstimatedCost)],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
  });

  doc.save(`Borges_e_Gomes_Relatorio_Reposicao_${new Date().toISOString().slice(0, 10)}.pdf`);
}
