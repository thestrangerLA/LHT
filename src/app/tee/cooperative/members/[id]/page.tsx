
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getCooperativeMember } from '@/services/cooperativeMemberService';
import MemberDetailPageClient from './client-page';
import { Skeleton } from '@/components/ui/skeleton';
import type { CooperativeMember } from '@/lib/types';

export default function MemberDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<CooperativeMember | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id && id !== 'default') {
        setLoading(true);
        getCooperativeMember(id).then(memberData => {
            setMember(memberData);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch member:", err);
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
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  if (!member) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Member not found</h1>
        </div>
    );
  }
  
  return <MemberDetailPageClient initialMember={member} initialDeposits={[]} />;
}
