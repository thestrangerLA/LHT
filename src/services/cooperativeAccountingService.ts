
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Currency } from '@/lib/types'

export async function createTransaction(
  debitAccountId: string,
  creditAccountId: string,
  amount: Currency,
  description: string
) {
  const now = new Date()

  await addDoc(collection(db, 'cooperative-transactions'), {
    date: now,
    accountId: debitAccountId,
    type: 'debit',
    amount,
    description,
    createdAt: serverTimestamp(),
  })

  await addDoc(collection(db, 'cooperative-transactions'), {
    date: now,
    accountId: creditAccountId,
    type: 'credit',
    amount,
    description,
    createdAt: serverTimestamp(),
  })
}

export function sumCurrency(a: Currency, b: Currency): Currency {
  return {
    kip: (a.kip || 0) + (b.kip || 0),
    thb: (a.thb || 0) + (b.thb || 0),
    usd: (a.usd || 0) + (b.usd || 0),
  }
}
