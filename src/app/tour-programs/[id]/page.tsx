
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTourProgram } from '@/services/tourProgramService';
import type { TourProgram } from '@/lib/types';
import TourProgramClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function TourProgramPage() {
  const params = useParams();
  const id = params.id as string;
  const [program, setProgram] = useState<TourProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'default') {
      setLoading(true);
      getTourProgram(id).then(programData => {
        setProgram(programData);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch tour program:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="w-full max-w-screen-xl space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Tour Program not found</h1>
        </div>
    );
  }

  return <TourProgramClientPage initialProgram={program} />;
}
