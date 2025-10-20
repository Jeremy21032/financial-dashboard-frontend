import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, filename = 'reporte_gastos') => {
  try {
    // Crear un nuevo workbook
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen de estadísticas
    const summaryData = [
      ['ESTADÍSTICAS FINANCIERAS', ''],
      ['Total Gastos', `$${data.totalExpenses.toFixed(2)}`],
      ['Total Ingresos', `$${data.totalPayments.toFixed(2)}`],
      ['Balance Neto', `$${data.netBalance.toFixed(2)}`],
      ['Gastos Promedio', `$${(data.totalExpenses / Math.max(data.expenseCount, 1)).toFixed(2)}`],
      ['', ''],
      ['GASTOS POR CATEGORÍA', ''],
      ['Categoría', 'Monto', 'Porcentaje', 'Cantidad de Gastos']
    ];

    // Agregar datos de categorías
    data.expenseByCategory.forEach(item => {
      summaryData.push([
        item.category,
        `$${item.amount.toFixed(2)}`,
        `${item.percentage.toFixed(2)}%`,
        item.count
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

    // Hoja 2: Detalle de gastos
    if (data.expenses && data.expenses.length > 0) {
      const expenseData = [
        ['FECHA', 'CATEGORÍA', 'DESCRIPCIÓN', 'MONTO', 'OBSERVACIÓN']
      ];

      data.expenses.forEach(expense => {
        expenseData.push([
          expense.date,
          expense.category || 'Sin categoría',
          expense.description || '',
          `$${parseFloat(expense.amount).toFixed(2)}`,
          expense.observacion || ''
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de Gastos');
    }

    // Hoja 3: Tendencia mensual
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      const trendData = [
        ['MES', 'MONTO GASTADO']
      ];

      data.monthlyTrend.forEach(month => {
        trendData.push([
          month.month,
          `$${month.amount.toFixed(2)}`
        ]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Tendencia Mensual');
    }

    // Generar y descargar el archivo
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};

export const exportToPDF = (data, courseName, filename = 'reporte_gastos') => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Configuración del documento
    doc.setFontSize(20);
    doc.text('REPORTE DE ANÁLISIS DE GASTOS', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.text(`Curso: ${courseName || 'Sin especificar'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
    yPosition += 20;
    
    // Estadísticas principales
    doc.setFontSize(14);
    doc.text('ESTADÍSTICAS PRINCIPALES', 20, yPosition);
    yPosition += 10;
    
    const statsData = [
      ['Total Gastos', `$${data.totalExpenses.toFixed(2)}`],
      ['Total Ingresos', `$${data.totalPayments.toFixed(2)}`],
      ['Balance Neto', `$${data.netBalance.toFixed(2)}`],
      ['Gastos Promedio', `$${(data.totalExpenses / Math.max(data.expenseCount || 1, 1)).toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Concepto', 'Monto']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Gastos por categoría
    if (data.expenseByCategory && data.expenseByCategory.length > 0) {
      doc.setFontSize(14);
      doc.text('GASTOS POR CATEGORÍA', 20, yPosition);
      yPosition += 10;
      
      const categoryData = data.expenseByCategory.map(item => [
        item.category,
        `$${item.amount.toFixed(2)}`,
        `${item.percentage.toFixed(2)}%`,
        item.count
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Categoría', 'Monto', 'Porcentaje', 'Cantidad']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10 }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Tendencia mensual
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      doc.setFontSize(14);
      doc.text('TENDENCIA MENSUAL (ÚLTIMOS 6 MESES)', 20, yPosition);
      yPosition += 10;
      
      const trendData = data.monthlyTrend.map(month => [
        month.month,
        `$${month.amount.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Mes', 'Monto']],
        body: trendData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10 }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Detalle de gastos (si hay espacio)
    if (data.expenses && data.expenses.length > 0 && yPosition < 200) {
      doc.setFontSize(14);
      doc.text('DETALLE DE GASTOS (PRIMEROS 10)', 20, yPosition);
      yPosition += 10;
      
      const expenseData = data.expenses.slice(0, 10).map(expense => [
        expense.date,
        expense.category || 'Sin categoría',
        expense.description ? expense.description.substring(0, 25) + '...' : '',
        `$${parseFloat(expense.amount).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });
    }

    // Pie de página
    doc.setFontSize(8);
    doc.text('Reporte generado automáticamente por Financial Dashboard Admin', 20, doc.internal.pageSize.height - 20);
    
    // Descargar el archivo
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    return false;
  }
};

export const exportToCSV = (data, filename = 'reporte_gastos') => {
  try {
    let csvContent = 'ESTADÍSTICAS FINANCIERAS\n';
    csvContent += 'Concepto,Monto\n';
    csvContent += `Total Gastos,$${data.totalExpenses.toFixed(2)}\n`;
    csvContent += `Total Ingresos,$${data.totalPayments.toFixed(2)}\n`;
    csvContent += `Balance Neto,$${data.netBalance.toFixed(2)}\n`;
    csvContent += `Gastos Promedio,$${(data.totalExpenses / Math.max(data.expenseCount, 1)).toFixed(2)}\n\n`;
    
    csvContent += 'GASTOS POR CATEGORÍA\n';
    csvContent += 'Categoría,Monto,Porcentaje,Cantidad\n';
    
    data.expenseByCategory.forEach(item => {
      csvContent += `${item.category},$${item.amount.toFixed(2)},${item.percentage.toFixed(2)}%,${item.count}\n`;
    });
    
    csvContent += '\nTENDENCIA MENSUAL\n';
    csvContent += 'Mes,Monto\n';
    
    data.monthlyTrend.forEach(month => {
      csvContent += `${month.month},$${month.amount.toFixed(2)}\n`;
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    return true;
  } catch (error) {
    console.error('Error al exportar a CSV:', error);
    return false;
  }
};
