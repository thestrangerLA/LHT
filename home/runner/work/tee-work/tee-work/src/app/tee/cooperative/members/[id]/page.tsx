
import { getCooperativeMember, getCooperativeDepositsForMember, getAllCooperativeMemberIds } from '@/services/cooperativeMemberService';
import type { Metadata } from 'next';
import MemberDetailPageClient from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllCooperativeMemberIds();
    if (ids.length === 0) {
      return [{ id: 'default' }];
    }
    return ids.map(id => ({ id }));
  } catch (error) {
    console.error("Error fetching static params for members:", error);
    return [{ id: 'default' }];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (params.id === 'default') {
    return { title: 'ລາຍລະອຽດສະມາຊິກ' };
  }
  const member = await getCooperativeMember(params.id);
  if (!member) {
    return { title: 'ບໍ່ພົບສະມາຊິກ' };
  }
  return {
    title: `ສະມາຊິກ: ${member.name}`,
  };
}

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  if (params.id === 'default') {
    return (
        <div className="flex justify-center items-center h-screen">
             <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 sm:px-6 md:gap-8">
                 <Skeleton className="h-14 w-full" />
                 <Skeleton className="h-[200px] w-full" />
                 <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
    );
  }

  const member = await getCooperativeMember(params.id);
  const deposits = await getCooperativeDepositsForMember(params.id);

  if (!member) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>ບໍ່ພົບຂໍ້ມູນສະມາຊິກ</h1>
        </div>
    );
  }

  return <MemberDetailPageClient initialMember={member} initialDeposits={deposits} />;
}
