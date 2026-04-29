import { createContext, useContext } from 'react';
import type { SavedCard } from '../services/paymentMethods';
import type { TabId } from '../components/Tabs';

export interface PaymentState {
  savedCards: SavedCard[];
  selectedCardId: string | null;
  selectedPlanId: number | null;
  isCheckoutOpen: boolean;
  sourceTab: TabId | null; // which tab opened checkout
}

export interface PaymentContextValue {
  state: PaymentState;
  addCard: (card: SavedCard) => void;
  removeCard: (id: string) => void;
  selectCard: (id: string | null) => void;
  selectPlan: (id: number | null) => void;
  openCheckout: (tab: TabId) => void;
  closeCheckout: () => void;
  selectedCard: SavedCard | null;
}

export const PaymentContext = createContext<PaymentContextValue | null>(null);

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
}
