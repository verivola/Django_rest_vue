"use client";
import ExportButtons from './components/ExportButtons';
import { useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Activity, 
  TrendingUp, TrendingDown, Trash, Brush, CircleSlash, 
  PlusCircle, Search 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';    

type Transaction = {
  id: string;
  text: string;
  amount: number;
  created_at: string;
};

export default function Home() {
  // ==================== STATES ====================
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ==================== FONCTION FORMAT DATE ====================
  const formDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== FILTRE DE RECHERCHE INTELLIGENT ====================
  const normalizedSearch = search.toLowerCase().trim();
  

  const filteredTransactions = transactions.filter((t) => {
    if (!normalizedSearch) return true;

    const term = normalizedSearch;

    // Recherche dans le texte
    if ((t.text ?? "").toLowerCase().includes(term)) return true;

    // Recherche dans le montant
    if (t.amount?.toString().includes(term) || 
        t.amount?.toLocaleString('fr-FR').includes(term)) {
      return true;
    }

    // Recherche dans la date
    const date = new Date(t.created_at);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      const dateFormats = [
        formDate(t.created_at).toLowerCase(),
        `${day}/${month}`,
        `${day}/${month}/${year}`,
        `${year}-${month}-${day}`,
        date.toLocaleDateString('fr-FR', { month: 'long' }).toLowerCase(),
        date.toLocaleDateString('fr-FR', { month: 'short' }).toLowerCase(),
      ];

      if (dateFormats.some(format => format.includes(term))) return true;
    }

    return false;
  });

  // ==================== API FUNCTIONS ====================
  const getTransactions = async () => {
    try {
      const res = await api.get<Transaction[]>('transactions/');
      setTransactions(res.data);
    } catch (error) {
      toast.error('Erreur de chargement des transactions');
      console.error(error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`transactions/${id}/`);
      getTransactions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const addTransaction = async () => {
    if (!text.trim() || amount === 0 || isNaN(amount)) {
      toast.error('Veuillez entrer une description et un montant valide');
      return;
    }

    setLoading(true);
    try {
      await api.post('transactions/', { text: text.trim(), amount });
      getTransactions();
      closeModal();
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction) return;

    setLoading(true);
    try {
      await api.put(`transactions/${editingTransaction.id}/`, { text: text.trim(), amount });
      await getTransactions();
      closeModal();
      resetForm();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setText('');
    setAmount(0);
    setEditingTransaction(null);
  };

  const closeModal = () => {
    const modal = document.getElementById('transaction_modal') as HTMLDialogElement;
    modal?.close();
  };

  // ==================== WEB SOCKET ====================
  useEffect(() => {
    getTransactions();

    const socket = new WebSocket("ws://127.0.0.1:8000/ws/notifications/");

    socket.onopen = () => {
      setIsConnected(true);
      toast.success("🔴 Temps réel activé", { duration: 1800 });
    };

    socket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        const data = response.data || response;

        switch (data.type) {
          case "created":
            setTransactions(prev => [data.transaction, ...prev]);
            toast.success(`✅ ${data.transaction.text}`);
            break;
          case "updated":
            setTransactions(prev =>
              prev.map(t => t.id === data.transaction.id ? data.transaction : t)
            );
            toast.success(`✏️ ${data.transaction.text}`);
            break;
          case "deleted":
            setTransactions(prev => prev.filter(t => t.id !== data.id));
            toast.error("🗑️ Transaction supprimée");
            break;
        }
      } catch (err) {
        console.error(err);
      }
    };

    socket.onerror = () => toast.error("Erreur WebSocket");
    socket.onclose = () => {
      setIsConnected(false);
      toast("Connexion temps réel fermée", { icon: '⚠️' });
    };

    return () => socket.close();
  }, []);

  // ==================== CALCULS ====================
  const amounts = transactions.map(t => Number(t.amount) || 0);
  const balance = amounts.reduce((acc, val) => acc + val, 0);
  const income = amounts.filter(a => a > 0).reduce((acc, val) => acc + val, 0);
  const expense = amounts.filter(a => a < 0).reduce((acc, val) => acc + val, 0);
  const ratio = income > 0 ? Math.min((Math.abs(expense) / income) * 100, 100) : 0;

  const confirmDelete = (t: Transaction) => {
    toast((t_id) => (
      <div className="flex flex-col gap-3">
        <p>Supprimer <strong>{t.text}</strong> ?</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-xs btn-ghost" onClick={() => toast.dismiss(t_id.id)}>
            Annuler
          </button>
          <button
            className="btn btn-xs btn-error text-white"
            onClick={() => {
              toast.dismiss(t_id.id);
              deleteTransaction(t.id);
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  //EXPORT PDF AND EXCEL

  //FIN EXPORT PDF AND EXCEL

    // Pagination Logic
  const totalFiltered = filteredTransactions.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Réinitialiser la page quand on recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  //Export PDF and Excel
const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rapport des Transactions", 14, 20);

    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    doc.text(`Total des transactions: ${filteredTransactions.length}`, 14, 37);

    const tableColumn = ["N°", "Description", "Montant (Ar)", "Date"];
    const tableRows = filteredTransactions.map((t, index) => [
      index + 1,
      t.text,
      t.amount > 0 ? `+${t.amount}` : t.amount,
      formDate(t.created_at)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 151] },
    });

    doc.save(`Rapport_Transactions_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("✅ Export PDF réussi !");
  };


  //FIn de export PDF and Excel

  // ==================== RENDER ====================
  return (
    <div className="w-2/3 flex flex-col gap-4 mx-auto ">
      {/* Statut WebSocket */}
      

      {/* Recherche */}
      <label className="input input-bordered flex items-center mt-20 gap-2">
        <Search className="w-4 h-4 opacity-60" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (description, montant, date...)"
          className="grow"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-red-500">
            ✕
          </button>
        )}
      </label>

      <div className="flex justify-center">
        <div className={`badge ${isConnected ? 'badge-success' : 'badge-error'} gap-2`}>
          {isConnected ? '● En ligne' : '● Hors ligne'}
        </div>
      </div>

      {/* Soldes */}
      <div className="flex justify-between rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">
        <div className="flex flex-col gap-1">
          <div className="badge badge-soft"><Wallet className="w-4 h-4" /> Solde</div>
          <div className="text-2xl font-bold">{balance.toLocaleString('fr-FR')} Ar</div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="badge badge-soft badge-success"><ArrowUpCircle className="w-4 h-4" /> Revenus</div>
          <div className="text-xl font-semibold text-success">{income.toLocaleString('fr-FR')} Ar</div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="badge badge-soft badge-error"><ArrowDownCircle className="w-4 h-4" /> Dépenses</div>
          <div className="text-xl font-semibold text-error">{Math.abs(expense).toLocaleString('fr-FR')} Ar</div>
        </div>
      </div>
    
    <div className='flex flex-row-reverse gap-2'>
        <button
          className="btn btn-error btn-sm place-self-start sm:btn-md"
          onClick={exportToPDF}
        >
          📕 Exporter PDF
        </button>
        {/* bouton export au dessus</div> */}
      <button
        className="btn btn-primary place-self-starts"
        onClick={() => {
          setMode("add");
          setEditingTransaction(null);
          setText("");
          setAmount("" as any as number);
          (document.getElementById('transaction_modal') as HTMLDialogElement)?.showModal();
        }}
      >
        <PlusCircle className="w-4 h-4" />
        Nouvelle transaction

        
      </button>
      
      </div>
      {/* Ratio */}
      <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-4">
        <div className="flex justify-between mb-2">
          <div className="badge badge-soft badge-warning gap-1">
            <Activity className="w-4 h-4" /> Ratio Dépenses/Revenus
          </div>
          <div className="font-medium">{ratio.toFixed(0)}%</div>
        </div>
        <progress className="progress progress-warning w-full" value={ratio} max="100" />
      </div>

      {/* Bouton Ajouter */}
      
      

      {/* Tableau */}
      {/* <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 opacity-70">
                  <CircleSlash className="w-10 h-10 mx-auto mb-2" />
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, index) => (
                <tr key={t.id}>
                  <th>{index + 1}</th>
                  <td className="font-medium">{t.text}</td>
                  <td className="flex items-center gap-2 font-medium">
                    {t.amount > 0 ? (
                      <TrendingUp className="text-success" />
                    ) : (
                      <TrendingDown className="text-error" />
                    )}
                    {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString('fr-FR')} Ar
                  </td>
                  <td>{formDate(t.created_at)}</td>
                  <td>
                    <div className="join">
                      <button
                        className="btn btn-sm btn-warning join-item"
                        onClick={() => {
                          setMode("edit");
                          setEditingTransaction(t);
                          setText(t.text);
                          setAmount(t.amount);
                          (document.getElementById('transaction_modal') as HTMLDialogElement)?.showModal();
                        }}
                      >
                        <Brush className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-error join-item"
                        onClick={() => confirmDelete(t)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       
      </div>

      
        <div className="join align-middle justify-end-safe mt-1">
          <button className="join-item btn">1</button>
          <button className="join-item btn">2</button>
          <button className="join-item btn btn-disabled">...</button>
          <button className="join-item btn">99</button>
          <button className="join-item btn">100</button>
        </div> */}

        {/* nouveau tableau */}

          {/* Tableau */}
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 opacity-70">
                  <CircleSlash className="w-10 h-10 mx-auto mb-2" />
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t, index) => (
                <tr key={t.id}>
                  <th>{(currentPage - 1) * itemsPerPage + index + 1}</th>
                  <td className="font-medium">{t.text}</td>
                  <td className="flex items-center gap-2 font-medium">
                    {t.amount > 0 ? (
                      <TrendingUp className="text-success" />
                    ) : (
                      <TrendingDown className="text-error" />
                    )}
                    {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString('fr-FR')} Ar
                  </td>
                  <td>{formDate(t.created_at)}</td>
                  <td>
                    <div className="join">
                      <button
                        className="btn btn-sm btn-warning join-item"
                        onClick={() => {
                          setMode("edit");
                          setEditingTransaction(t);
                          setText(t.text);
                          setAmount(t.amount);
                          (document.getElementById('transaction_modal') as HTMLDialogElement)?.showModal();
                        }}
                      >
                        <Brush className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-error join-item"
                        onClick={() => confirmDelete(t)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== PAGINATION ==================== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6 px-2">
          <div className="text-sm text-green-500">
            {totalFiltered} transaction{totalFiltered > 1 ? 's' : ''} • 
            Page {currentPage} sur {totalPages}
          </div>

          <div className="join">
        <button
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Précédent
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                ? totalPages - 4 + i 
                : currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant →
            </button>
          </div>

          <select
            className="select select-bordered select-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10 par page</option>
            <option value={15}>15 par page</option>
         
          </select>
        </div>
      )}

      {/* MODAL */}
      <dialog id="transaction_modal" className="modal backdrop-blur-sm">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {mode === "edit" ? "Modifier la transaction" : "Nouvelle transaction"}
          </h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Ex: Achat téléphone"
              />
            </div>

            <div>
              <label className="label">Montant (Ar)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || "" as any as number)}
                className="input input-bordered w-full"
                placeholder='ex: 1 000Ar'
              />
            </div>

            <button
              className="btn btn-warning w-full"
              onClick={mode === "add" ? addTransaction : updateTransaction}
              disabled={loading}
            >
              {loading ? "Enregistrement en cours..." : mode === "edit" ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}