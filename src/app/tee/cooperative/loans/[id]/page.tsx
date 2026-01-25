
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLoan } from '@/services/cooperativeLoanService';
import type { Loan } from '@/lib/types';
import LoanDetailPageClient from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'default') {
      setLoading(true);
      getLoan(id).then(loanData => {
        setLoan(loanData);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch loan:", err);
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [id]);

  if (loading) {
      return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="w-full max-w-4xl space-y-4">
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
      );
  }
  
  if (!loan) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Loan not found</h1>
        </div>
    );
  }

  return <LoanDetailPageClient initialLoan={loan} />;
}
