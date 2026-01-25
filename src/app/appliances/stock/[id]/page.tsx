
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApplianceStockItem } from '@/services/applianceStockService';
import type { ApplianceStockItem } from '@/lib/types';
import ApplianceStockClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplianceStockDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<ApplianceStockItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'default') {
      setLoading(true);
      getApplianceStockItem(id).then(itemData => {
        setItem(itemData);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch stock item:", err);
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [id]);

  if (loading) {
     return (
        <div className="flex flex-col gap-4 p-4 sm:px-6 md:gap-8">
             <Skeleton className="h-14 w-full" />
             <Skeleton className="h-[200px] w-full" />
             <Skeleton className="h-[400px] w-full" />
        </div>
    );
  }

  if (!item) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Stock Item not found</h1>
        </div>
    );
  }

  return <ApplianceStockClientPage initialItem={item} />;
}
