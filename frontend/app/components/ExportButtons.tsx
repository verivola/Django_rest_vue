'use client';

import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';

type ExportButtonsProps = {
  transactions: Transaction[];
  formDate: (dateStr: string) => string;
};

export default function ExportButtons({ transactions, formDate }: ExportButtonsProps) {

  // ==================== EXPORT EXCEL ====================
  // const exportToExcel = () => {
  //   if (transactions.length === 0) {
  //     toast.error("Aucune transaction à exporter");
  //     return;
  //   }

  //   const dataToExport = transactions.map((t, index) => ({
  //     N°: index + 1,
  //     Description: t.text,
  //     Montant: t.amount,
  //     "Montant Formaté": t.amount > 0 
  //       ? `+${t.amount.toLocaleString('fr-FR')} Ar` 
  //       : `${t.amount.toLocaleString('fr-FR')} Ar`,
  //     Date: formDate(t.created_at),
  //   }));

  //   const ws = XLSX.utils.json_to_sheet(dataToExport);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  //   ws['!cols'] = [
  //     { wch: 5 },
  //     { wch: 45 },
  //     { wch: 15 },
  //     { wch: 22 },
  //     { wch: 25 },
  //   ];

  //   XLSX.writeFile(wb, `Transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  //   toast.success(`✅ ${transactions.length} transactions exportées en Excel`);
  // };

  // ==================== EXPORT PDF ====================
  const exportToPDF = async () => {
    if (transactions.length === 0) {
      toast.error("Aucune transaction à exporter");
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Rapport des Transactions", 14, 20);

      doc.setFontSize(11);
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      doc.text(`Total : ${transactions.length} transactions`, 14, 37);

      const tableColumn = ["N°", "Description", "Montant (Ar)", "Date"];
      const tableRows = transactions.map((t, index) => [
        index + 1,
        t.text,
        t.amount > 0 ? `+${t.amount}` : `${t.amount}`,
        formDate(t.created_at)
      ]);

      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`Transactions_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("✅ Export PDF réussi !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

 
}