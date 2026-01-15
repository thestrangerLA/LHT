
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, writeBatch, doc, getDoc, runTransaction, serverTimestamp, query, where, orderBy, onSnapshot, endAt, startAt, deleteDoc, increment, getDocs } from 'firebase/firestore';
import type { Sale } from '@/lib/types';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const salesCollectionRef = collection(db, 'applianceSales');
const stockCollectionRef = collection(db, 'applianceStockItems');

export const saveApplianceSale = async (invoiceData: any): Promise<string> => {
  const saleDocRef = doc(salesCollectionRef);
  
  await runTransaction(db, async (transaction) => {
    const stockItemsToUpdate: { ref: any, currentStock: number }[] = [];

    // 1. READ all necessary stock documents first
    for (const item of invoiceData.items) {
      const itemDocRef = doc(db, 'applianceStockItems', item.id);
      const itemDoc = await transaction.get(itemDocRef);

      if (!itemDoc.exists()) {
        throw new Error(`Item ${item.name} not found.`);
      }
      
      const currentStock = itemDoc.data().currentStock;
      if (currentStock < item.quantity) {
          throw new Error(`Not enough stock for ${item.name}. Only ${currentStock} left.`);
      }

      stockItemsToUpdate.push({ ref: itemDocRef, currentStock });
    }

    // 2. Now perform all WRITE operations
    // Set the sale document
    transaction.set(saleDocRef, {
      ...invoiceData,
      createdAt: serverTimestamp()
    });

    // Update stock and create logs for all items
    for (let i = 0; i < invoiceData.items.length; i++) {
        const item = invoiceData.items[i];
        const stockInfo = stockItemsToUpdate[i];
        const newStock = stockInfo.currentStock - item.quantity;

        transaction.update(stockInfo.ref, { currentStock: newStock });

        const logDocRef = doc(collection(db, 'applianceStockLogs'));
        transaction.set(logDocRef, {
            itemId: item.id,
            change: -item.quantity,
            newStock: newStock,
            type: 'sale',
            detail: `Invoice #${saleDocRef.id.substring(0, 5)}...`,
            createdAt: serverTimestamp(),
        });
    }
  });

  return saleDocRef.id;
};

export const getApplianceSale = async (saleId: string): Promise<Sale | null> => {
    const saleDocRef = doc(db, 'applianceSales', saleId);
    const docSnap = await getDoc(saleDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            date: toDateSafe(data.date) || new Date(),
            createdAt: toDateSafe(data.createdAt) || new Date(),
        } as Sale;
    }
    return null;
};

export const getAllApplianceSaleIds = async (): Promise<{ id: string }[]> => {
    const q = query(salesCollectionRef);
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => ({ id: doc.id }));
    if (ids.length === 0) {
        return [{ id: 'default' }];
    }
    return ids;
};

export const listenToApplianceSalesByDate = (date: Date, callback: (sales: Sale[]) => void) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const q = query(
        salesCollectionRef,
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        ...safeOrderBy("date", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
        const salesData: Sale[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            salesData.push({
                id: doc.id,
                ...data,
                date: toDateSafe(data.date) || new Date(),
                createdAt: toDateSafe(data.createdAt) || new Date(),
            } as Sale);
        });
        callback(salesData);
    });
};

export const deleteApplianceSale = async (saleId: string) => {
    const saleDocRef = doc(salesCollectionRef, saleId);

    await runTransaction(db, async (transaction) => {
        const saleDoc = await transaction.get(saleDocRef);
        if (!saleDoc.exists()) {
            throw new Error("Sale document not found.");
        }
        const saleData = saleDoc.data() as Sale;

        // Revert stock for each item in the sale
        for (const item of saleData.items) {
            const stockItemRef = doc(stockCollectionRef, item.id);
            transaction.update(stockItemRef, { currentStock: increment(item.quantity) });

            const logRef = doc(collection(db, 'applianceStockLogs'));
            transaction.set(logRef, {
                itemId: item.id,
                change: item.quantity,
                newStock: -1, // Placeholder, will be recalculated by listeners if needed, or can be improved
                type: 'stock-in',
                detail: `Reversal for deleted sale #${saleId.substring(0, 5)}`,
                createdAt: serverTimestamp(),
            });
        }
        
        // Also remove the associated transaction in the general ledger
        const q = query(collection(db, 'appliances-transactions'), where("saleId", "==", saleId));
        const transactionSnapshot = await getDocs(q);
        transactionSnapshot.forEach((doc) => {
             transaction.delete(doc.ref);
        });


        // Delete the sale document
        transaction.delete(saleDocRef);
    });
};
