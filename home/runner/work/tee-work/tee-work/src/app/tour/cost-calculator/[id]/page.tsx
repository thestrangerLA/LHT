

import type { Metadata } from 'next';
import { getFirestore, collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SavedCalculation } from './client-page';
import TourCalculatorClientPage from './client-page';
import { toDateSafe } from '@/lib/timestamp';

export const dynamic = 'force-static';
export const dynamicParams = true;

async function getTourCostCalculation(id: string): Promise<SavedCalculation | null> {
    const firestore = getFirestore(db.app);
    const docRef = doc(firestore, 'tourCalculations', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        
        const tourInfo = data.tourInfo || {};
        if (tourInfo.startDate) {
            tourInfo.startDate = toDateSafe(tourInfo.startDate)?.toISOString() || null;
        }
        if (tourInfo.endDate) {
            tourInfo.endDate = toDateSafe(tourInfo.endDate)?.toISOString() || null;
        }

        const allCosts = data.allCosts || {};
        const processDateFields = (items: any[]) => {
          return items?.map(item => {
            const newItem = { ...item };
            if (newItem.checkInDate) {
                newItem.checkInDate = toDateSafe(newItem.checkInDate)?.toISOString() || null;
            }
            if (newItem.departureDate) {
                newItem.departureDate = toDateSafe(newItem.departureDate)?.toISOString() || null;
            }
            return newItem;
          }) || [];
        }
        allCosts.accommodations = processDateFields(allCosts.accommodations);
        allCosts.flights = processDateFields(allCosts.flights);
        allCosts.trainTickets = processDateFields(allCosts.trainTickets);
        allCosts.overseasPackages = allCosts.overseasPackages || [];
        allCosts.activities = allCosts.activities || [];

        const savedAt = data.savedAt;
        return {
            id: docSnap.id,
            tourInfo,
            allCosts,
            exchangeRates: data.exchangeRates,
            profitPercentage: data.profitPercentage,
            savedAt: toDateSafe(savedAt)?.toISOString() || null,
        } as SavedCalculation;
    } else {
        return null;
    }
}


export async function generateStaticParams() {
  try {
    const firestore = getFirestore(db.app);
    const calculationsColRef = collection(firestore, 'tourCalculations');
    const snapshot = await getDocs(calculationsColRef);
    const ids = snapshot.docs.map(doc => ({ id: doc.id }));
    
    // Add a 'default' param if no calculations are found to avoid build errors.
    if (ids.length === 0) {
      return [{ id: 'default' }];
    }
    return ids;
  } catch (error) {
    console.error("Error fetching static params for tour calculations:", error);
    return [{ id: 'default' }];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (params.id === 'default') {
      return { title: 'Tour Calculation' };
  }

  const calculation = await getTourCostCalculation(params.id);
  
  if (!calculation) {
    return { title: 'Calculation Not Found' };
  }

  return {
    title: `Calculation: ${calculation.tourInfo?.groupCode || 'Untitled'}`,
    description: `Cost calculation for tour: ${calculation.tourInfo?.program || ''}`,
  };
}

export default async function TourCalculatorPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (id === 'default') {
      return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-2xl font-semibold mb-4">Loading Calculation...</p>
                <p>This is a placeholder page for static export.</p>
            </div>
      );
  }
  
  const calculation = await getTourCostCalculation(id);

  if (!calculation) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Calculation not found</h1>
        </div>
    );
  }

  return <TourCalculatorClientPage initialCalculation={calculation} />;
}
