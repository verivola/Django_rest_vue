"use client";

import { useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { Wallet,ArrowUpCircle, ArrowDownCircle, Activity, TrendingUp, TrendingDown, Trash, Brush, CircleSlash, PlusCircle, Search} from 'lucide-react';

type Transaction = {
  id: string;
  text: string;
  amount: number;
  created_at: string;
};

export default function Home() {
//  Définir l'état pour les transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

 const [search, setSearch] = useState("");

const filteredTransactions = transactions.filter((t) =>
  (t.text ?? "")
    .toLowerCase()
    .trim()
    .includes(search.toLowerCase().trim())
);

  // 
  const [text , setText] = useState('');
  const [amount , setAmount] = useState(0);
  // const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
// Récuperer les élément de l'api
  const getTransactions = async () => {
    try {
      const res = await api.get<Transaction[]>('transactions/');
      setTransactions(res.data);
      toast.success('Transactions chargées avec succès!');
    } catch (error) {
      toast.error('Erreur de chargement des transactions');
      console.error("Misy zavatra tsy milamina: " + error);
    }
  };

  const openAddModal = () => {
  setMode("add");
  setEditingTransaction(null);
  setText("");
  setAmount(0);

  (document.getElementById('transaction_modal') as HTMLDialogElement).showModal();
};

  const openEditModal = (transaction: Transaction) => {
  setEditingTransaction(transaction);
  setText(transaction.text);
  setAmount(transaction.amount);
  setMode("edit");  


  (document.getElementById('transaction_modal') as HTMLDialogElement).showModal();
};

// Supprimer une transaction

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`transactions/${id}/`);
      toast.success('Transaction supprimée avec succès!');
      getTransactions(); // Recharger la liste des transactions
    } catch (error) {
      toast.error('Erreur de suppression de la transaction');
      console.error("Misy zavatra tsy milamina: " + error);
    }
  };

  const addTransaction = async () => {
    if(!text || amount === 0 || isNaN(amount) || amount === null){
      toast.error('Veuillez entrer une texte et un montant valide');
      return;
    }
    setLoading(true);
    try {
      await api.post('transactions/', { text, amount });  
      getTransactions(); // Recharger la liste des transactions

      const modal = document.getElementById('transaction_modal') as HTMLDialogElement;
      if (modal) {
        modal.close(); // Fermer le modal après l'ajout
      }
            toast.success('Transaction ajoutée avec succès!');
        setText('');
        setAmount('' as unknown as number);


    } catch (error) {
      toast.error('Erreur d\'ajout de la transaction');
      console.error("Misy zavatra tsy milamina: " + error);
    }finally{
      setLoading(false);
    }
  };

 const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
  setLoading(true);

  try {
    await api.put(`transactions/${id}/`, updatedData);

    toast.success('Transaction mise à jour avec succès!');

    await getTransactions();

    setText('');
    setAmount(0);
    setEditingTransaction(null);

    const modal = document.getElementById('transaction_modal') as HTMLDialogElement;    
    modal?.close();

  } catch (error) {
    toast.error('Erreur de mise à jour de la transaction');
    console.error(error);

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    getTransactions();
  }, []);

  const amounts = transactions.map(t => Number(t.amount) || 0);

  const balance = amounts.reduce((acc, val) => acc + val, 0);

  const income = amounts
    .filter(a => a > 0)
    .reduce((acc, val) => acc + val, 0);

  const expense = amounts
    .filter(a => a < 0)
    .reduce((acc, val) => acc + val, 0);

  const ratio = income > 0 ? Math.min(Math.abs(expense) / income * 100, 100) : 0;

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



  return (

    
    
    <div className='w-2/3 flex flex-col gap-4'>
      
      {/* commence eto ny barre de recherche */}
      {/* <label className="input validator">
  <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeWidth="2.5"
      fill="none"
      stroke="currentColor"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </g>
  </svg>
  <input
    type="text"
    value={search}
    onChange={(e)=> setSearch(e.target.value)}
    placeholder="Search"
    // pattern="[A-Za-z][A-Za-z0-9\-]*"
   
    title="Only letters, numbers or dash"
  />
</label> */}
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
<p className="validator-hint">
  Must be 3 to 30 characters
  <br />containing only letters, numbers or dash
</p>


{/* ary mifarana eto ilay izi */}
      <div className="flex justify-between rounded-2xl border-2 border-warning/10 
      border-dashed bg-warning/5 p-5">
      
      <div className="flex flex-col gap-1">
        <div className='badge badge-soft'>
          
            <Wallet className='w-4 h-4'/>
          Votre solde
          
        </div>

        <div className="state-value">
          {balance.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ar
        </div>

      </div>

      <div className="flex flex-col gap-1">
        <div className='badge badge-soft badge-success'>
          
            <ArrowUpCircle className='w-4 h-4'/>
          Revenus
          
        </div>

        <div className="state-value">
          {income.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ar
        </div>

      </div>

    <div className="flex flex-col gap-1">
        <div className='badge badge-soft badge-error'>
          
            <ArrowDownCircle className='w-4 h-4'/>
          Dépenses
          
        </div>

        <div className="state-value">
          {expense.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ar
        </div>

      </div>

      </div> 

    
      <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-2">
        <div className="flex justify-between items-center mb-1">
          
            <div className="badge badge-soft badge-warning gap-1">
              <Activity className='w-4 h-4'/>
              Dépense vs Revenus
            </div>
          
           <div>
            {ratio.toFixed(0)}% 
           </div>
        </div>

        <progress className='progress progress-warning w-full' value={ratio} max="100">

        </progress>
        
        {/* button */} 
        </div>

        {/* modal */}

        <button className="btn btn-primary  " 
        onClick={() => {
                setMode("add");              // ⭐ IMPORTANT
                setEditingTransaction(null); // reset edit
                setText("");
                setAmount(0);

                (document.getElementById('transaction_modal') as HTMLDialogElement).showModal();
              }}>
          <PlusCircle className='w-4 h-4'/>
          Ajouter une transaction
          </button>
        
         <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          {/* <!-- head --> */}
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          
<tbody>
  {filteredTransactions.length === 0 ? (
    <tr>
      <td colSpan={5} className="text-center py-6">
        <div className="flex flex-col items-center gap-3 opacity-70">
          <CircleSlash className="w-8 h-8 text-gray-400 animate-pulse" />
          Aucune donnée
        </div>
      </td>
    </tr>
  ) : (
    filteredTransactions.map((t, index) => (
      <tr key={t.id}>
        <th>{index + 1}</th>

        <td>{t.text}</td>

        <td className="flex items-center gap-2">
          {t.amount > 0 ? (
            <TrendingUp className="text-success w-6 h-6" />
          ) : (
            <TrendingDown className="text-error w-6 h-6" />
          )}

          {`${t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString(
            'fr-FR',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} Ar`}
        </td>

        <td>{formDate(t.created_at)}</td>

        <td>
          <button
            className="btn btn-sm btn-error btn-soft"
            onClick={() => deleteTransaction(t.id)}
          >
            <Trash className="w-4 h-4" />
          </button>

          <button
            className="btn btn-sm btn-warning btn-soft"
            onClick={() => openEditModal(t)}
          >
            <Brush className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
        </table>
</div>


<dialog id="transaction_modal" className="modal backdrop-blur-sm">
  <div className="modal-box border-2 border-warning/10 border-dashed">

    <form method="dialog">
      <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
        ✕
      </button>
    </form>

    {/* TITLE dynamique */}
    <h3 className="font-bold text-lg mb-4">
      {mode === "edit" ? "Modifier une transaction" : "Ajouter une transaction"}
    </h3>

    <div className="flex flex-col gap-4 mt-4">

      {/* TEXT */}
      <div className="flex flex-col gap-2">
        <label className="label text-emerald-500">Texte</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="Input w-full"
        />
      </div>

      {/* AMOUNT */}
      <div className="flex flex-col gap-2">
        <label className="label text-emerald-500">Montant</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="Input w-full"
        />
      </div>

      {/* BUTTON */}
      <button
        className="btn btn-warning w-full"
        onClick={async () => {
          if (mode === "add") {
            await addTransaction();
          } else {
            if (!editingTransaction) return;

            await updateTransaction(editingTransaction.id, {
              text,
              amount,
            });

            setEditingTransaction(null);
          }

          (document.getElementById('transaction_modal') as HTMLDialogElement).close();
        }}
      >
        <PlusCircle className="w-4 h-4" />

        {mode === "edit" ? "Modifier" : "Ajouter"}
      </button>

    </div>
  </div>
</dialog>





    </div>

    

    
  );
}