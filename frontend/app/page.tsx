"use client";

import { useEffect, useState } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { Wallet,ArrowUpCircle, ArrowDownCircle, Activity} from 'lucide-react';

type Transaction = {
  id: string;
  text: string;
  amount: number;
  created_at: string;
};

export default function Home() {

  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  useEffect(() => {
    getTransactions();
  }, []);

  const amount = transactions.map(t => Number(t.amount) || 0);

  const balance = amount.reduce((acc, val) => acc + val, 0);

  const income = amount
    .filter(a => a > 0)
    .reduce((acc, val) => acc + val, 0);

  const expense = amount
    .filter(a => a < 0)
    .reduce((acc, val) => acc + val, 0);

  const ratio = income > 0 ? Math.min(Math.abs(expense) / income * 100, 100) : 0;

  const formDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

    
      <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">
        <div className="flex justify-between items-center mb-1">
          
            <div className="badge badge-soft badge-warning gap-1">
              <Activity className='w-4 h-4'/>
              Dé pense vs Revenus
            </div>
          
           <div>
            {ratio.toFixed(0)}% 
           </div>
        </div>

        <progress className='progress progress-warning w-full' value={ratio} max="100">

        </progress>

        
          
        </div>
    </div>
  );
}