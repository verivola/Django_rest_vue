"use client";

import { useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { Wallet,ArrowUpCircle, ArrowDownCircle, Activity, TrendingUp, TrendingDown, Trash, Brush, CircleSlash, PlusCircle} from 'lucide-react';

type Transaction = {
  id: string;
  text: string;
  amount: number;
  created_at: string;
};

export default function Home() {
//  Définir l'état pour les transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 
  const [text , setText] = useState('');
  const [amount , setAmount] = useState(0);
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
        onClick={()=>(document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}>
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
            {
              // transactions.length === 0 ? (
              //   <tr>
              //     <td colSpan={5} className='text-center py-4'>
              //       <div className="flex flex-col items-center gap-3 opacity-70">
              //       <span className='text-4xl'></span>
              //       <p>Aucune transaction disponible</p>
              //       </div>
              //     </td>
              //   </tr>
              transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6">
                <div className="flex flex-col items-center gap-3 opacity-70">

                  {/* Icône animée */}
                  <span className="loading loading-spinner loading-lg text-primary"></span>

                  <span className="text-rotate text-4xl leading-loose">
                    <span className="justify-items-center">
                    
                      <span className='flex items-center gap-2'><CircleSlash className="w-8  h-8 text-gray-400 animate-pulse" />Aucune</span>
                      <span className="flex items-center gap-2 justify-center">🌎 donnée</span>
                      
                     
                    </span>
                  </span>

                </div>
              </td>
            </tr>
              ):(
                  transactions.map((t, index) => (
              <tr key={t.id}>
                <th>{index + 1}</th>
                <td>{t.text}</td>
                <td className='text-semibold flex items-center gap-2'>{t.amount > 0 ? (
                  <TrendingUp className='text-success w-6 h-6'/>
                ) : (
                  <TrendingDown className='text-error w-6 h-6'/>
                )}

                {`${t.amount > 0 ? '+' : t.amount < 0 ? '-' : ''}${Math.abs(t.amount).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} Ar`}
                
                
                </td>
                <td>{formDate(t.created_at)}</td>
                <td>
                  <button className="btn btn-sm btn-error btn-soft tooltip" onClick={() => deleteTransaction(t.id)} data-tip="Supprimer">
                    <Trash className='w-4 h-4'/>
                  </button>
                </td>
              </tr>
            ))
              )
            }
       
           
           
          </tbody>
        </table>
</div>


<dialog id="my_modal_3" className="modal backdrop-blur-sm">
          <div className="modal-box border-2 border-warning/10 border-dashed">
            <form method="dialog">
              {/* if there is a bu  tton in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg mb-4">Ajouter une transaction</h3>
             <div className='flex flex-col gap-4 mt-4'>

               <div className="flex flex-col gap-2">
                  <label  className='label'>Texte</label>
                  <input 
                  type="text" 
                  name="text  "
                  value={text}
                  onChange={(e)=> setText(e.target.value)}
                  placeholder='Entreez le text'
                  className='Input w-full'
                   />
               </div>
               
             </div>
          </div>
        </dialog>


    </div>

    

    
  );
}