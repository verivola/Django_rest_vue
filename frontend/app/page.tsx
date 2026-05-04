"use client";

import { useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Activity, 
  TrendingUp, TrendingDown, Trash, Brush, CircleSlash, 
  PlusCircle, Search 
} from 'lucide-react';

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

  // ==================== FILTERED LIST ====================
  const filteredTransactions = transactions.filter((t) =>
    (t.text ?? "").toLowerCase().trim().includes(search.toLowerCase().trim())
  );

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
      toast.error('Erreur de suppression');
    }
  };

  const addTransaction = async () => {
    if (!text || amount === 0 || isNaN(amount)) {
      toast.error('Veuillez entrer un texte et un montant valide');
      return;
    }

    setLoading(true);
    try {
      await api.post('transactions/', { text, amount });
      getTransactions();
      closeModal();
      setText('');
      setAmount(0);
    } catch (error) {
      toast.error("Erreur d'ajout");
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async () => {
    if (!editingTransaction) return;

    setLoading(true);
    try {
      await api.put(`transactions/${editingTransaction.id}/`, { text, amount });
      await getTransactions();
      closeModal();
      setText('');
      setAmount(0);
      setEditingTransaction(null);
    } catch (error) {
      toast.error('Erreur de mise à jour');
    } finally {
      setLoading(false);
    }
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
      toast.success("🔴 Connexion temps réel établie", { duration: 2000 });
    };

    socket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        const data = response.data || response;

        switch (data.type) {
          case "created":
            setTransactions((prev) => [data.transaction, ...prev]);
            toast.success(`✅ ${data.transaction.text}`);
            break;

          case "updated":
            setTransactions((prev) =>
              prev.map((t) => (t.id === data.transaction.id ? data.transaction : t))
            );
            toast.success(`✏️ ${data.transaction.text}`);
            break;

          case "deleted":
            setTransactions((prev) => prev.filter((t) => t.id !== data.id));
            toast.error("🗑️ Transaction supprimée");
            break;
        }
      } catch (err) {
        console.error("Erreur WebSocket parsing:", err);
      }
    };

    socket.onerror = () => {
      toast.error("Erreur de connexion WebSocket");
    };

    socket.onclose = () => {
      setIsConnected(false);
      toast("Connexion temps réel fermée", { icon: '⚠️' });
    };

    return () => {
      socket.close();
    };
  }, []);

  // ==================== CALCULS ====================
  const amounts = transactions.map((t) => Number(t.amount) || 0);
  const balance = amounts.reduce((acc, val) => acc + val, 0);
  const income = amounts.filter((a) => a > 0).reduce((acc, val) => acc + val, 0);
  const expense = amounts.filter((a) => a < 0).reduce((acc, val) => acc + val, 0);
  const ratio = income > 0 ? Math.min((Math.abs(expense) / income) * 100, 100) : 0;

  const formDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confirmDelete = (t: Transaction) => {
    toast((t_id) => (
      <div className="flex flex-col gap-2">
        <p>Supprimer <strong>{t.text}</strong> ?</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-xs btn-ghost" onClick={() => toast.dismiss(t_id.id)}>
            Non
          </button>
          <button
            className="btn btn-xs btn-error text-white"
            onClick={() => {
              toast.dismiss(t_id.id);
              deleteTransaction(t.id);
            }}
          >
            Oui
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // ==================== RENDER ====================
  return (
    // 
    <div className="w-2/3 flex flex-col gap-4 mx-auto">
      {/* Statut WebSocket */}
      <div className="flex justify-end">
        <div className={`badge ${isConnected ? 'badge-success' : 'badge-error'} gap-2`}>
          {isConnected ? '● En ligne' : '● Hors ligne'}
        </div>
      </div>

      {/* Recherche */}
      <label className="input input-bordered flex items-center gap-2">
        <Search className="w-4 h-4 opacity-60" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une transaction..."
          className="grow"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400">
            ✕
          </button>
        )}
      </label>

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
          <div className="text-xl font-semibold text-error">{expense.toLocaleString('fr-FR')} Ar</div>
        </div>
      </div>

      {/* Ratio */}
      <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-4">
        <div className="flex justify-between mb-2">
          <div className="badge badge-soft badge-warning gap-1">
            <Activity className="w-4 h-4" /> Dépense vs Revenus
          </div>
          <div>{ratio.toFixed(0)}%</div>
        </div>
        <progress className="progress progress-warning w-full" value={ratio} max="100" />
      </div>

      {/* Bouton Ajouter */}
      <button
        className="btn btn-primary self-start"
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
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <CircleSlash className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, index) => (
                <tr key={t.id}>
                  <th>{index + 1}</th>
                  <td>{t.text}</td>
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

      {/* MODAL */}
      <dialog id="transaction_modal" className="modal">
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
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="input input-bordered w-full"
              />
            </div>

            <button
              className="btn btn-warning w-full"
              onClick={mode === "add" ? addTransaction : updateTransaction}
              disabled={loading}
            >
              {loading ? "Enregistrement..." : mode === "edit" ? "Modifier" : "Ajouter"}
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