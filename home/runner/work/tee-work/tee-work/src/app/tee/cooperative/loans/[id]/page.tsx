

import type { Metadata } from 'next';
import { getLoan, getAllCooperativeLoanIds } from '@/services/cooperativeLoanService';
import LoanDetailPageClient from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllCooperativeLoanIds();
    if (ids.length === 0) {
      return [{ id: 'default' }];
    }
    return ids;
  } catch (error) {
    console.error("Error fetching static params for cooperative loans:", error);
    return [{ id: 'default' }];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (params.id === 'default') {
      return { title: 'ລາຍລະອຽດສິນເຊື່ອ' };
  }
  const loan = await getLoan(params.id);
  
  if (!loan) {
    return {
      title: 'ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ',
    }
  }

  return {
    title: `ສິນເຊື່ອ: ${loan.loanCode}`,
    description: `ລາຍລະອຽດຂອງສິນເຊື່ອ ${loan.loanCode}`,
  }
}

export default async function LoanDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params;

  if (id === 'default') {
      return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-2xl font-semibold mb-4">ກຳລັງໂຫຼດຂໍ້ມູນສິນເຊື່ອ...</p>
                <p>This is a placeholder page for static export.</p>
            </div>
      );
  }
  
  const loan = await getLoan(id);

  if (!loan) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ</h1>
        </div>
    );
  }

  return <LoanDetailPageClient initialLoan={loan} />;
}
