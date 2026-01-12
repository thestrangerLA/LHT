
import type { UserAction, ContractType } from '@/lib/types';

type AutoEntry = {
  debitAccountId: string;
  creditAccountId: string;
  contractType: ContractType;
};

const actionContractMap: Record<UserAction, ContractType> = {
  RECEIVE_CASH: 'SALE',
  PAY_CASH: 'SALE',
  MEMBER_DEPOSIT: 'QARD',
  MEMBER_WITHDRAW: 'QARD',
  SELL_CASH: 'SALE',
  SELL_CREDIT: 'SALE',
  COLLECT_RECEIVABLE: 'SALE',
  BUY_CASH: 'SALE',
  BUY_CREDIT: 'SALE',
  QARD_HASAN_GIVE: 'QARD',
  QARD_HASAN_RECEIVE: 'QARD'
};

export function mapActionToEntry(action: UserAction): AutoEntry {
  const contractType = actionContractMap[action];
  if (!contractType) {
    throw new Error(`Unsupported action or missing contract type for: ${action}`);
  }

  switch (action) {
    case 'RECEIVE_CASH':
      return {
        debitAccountId: 'cash',
        creditAccountId: 'income_general', // Or a more specific income account
        contractType,
      };

    case 'PAY_CASH':
      return {
        debitAccountId: 'expense_general',
        creditAccountId: 'cash',
        contractType,
      };

    case 'MEMBER_DEPOSIT':
      return {
        debitAccountId: 'cash',
        creditAccountId: 'deposits_liability',
        contractType,
      };

    case 'MEMBER_WITHDRAW':
        return {
          debitAccountId: 'deposits_liability',
          creditAccountId: 'cash',
          contractType,
        };

    case 'SELL_CREDIT':
      return {
        debitAccountId: 'accounts_receivable',
        creditAccountId: 'sales_income',
        contractType,
      };

    case 'COLLECT_RECEIVABLE':
      return {
        debitAccountId: 'cash',
        creditAccountId: 'accounts_receivable',
        contractType,
      };
      
    case 'QARD_HASAN_GIVE':
      return {
        debitAccountId: 'loan_receivable',
        creditAccountId: 'cash',
        contractType,
      };

    case 'QARD_HASAN_RECEIVE':
        return {
            debitAccountId: 'cash',
            creditAccountId: 'loan_receivable',
            contractType
        };
        
    // Add other cases here
    // e.g., 'BUY_CASH', 'SELL_MURABAHA', etc.

    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}
