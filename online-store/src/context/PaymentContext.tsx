import { useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SavedCard } from '../services/paymentMethods';
import type { TabId } from '../components/Tabs';
import { PaymentContext, type PaymentState } from './usePayment';

const STORAGE_KEY = 'nexshop_saved_cards';

type PaymentAction =
  | { type: 'ADD_CARD'; payload: SavedCard }
  | { type: 'REMOVE_CARD'; payload: string }
  | { type: 'SELECT_CARD'; payload: string | null }
  | { type: 'SELECT_PLAN'; payload: number | null }
  | { type: 'OPEN_CHECKOUT'; payload: TabId }
  | { type: 'CLOSE_CHECKOUT' };

function loadSavedCards(): SavedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case 'ADD_CARD': {
      const cards = [...state.savedCards, action.payload];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      return { ...state, savedCards: cards, selectedCardId: action.payload.id };
    }
    case 'REMOVE_CARD': {
      const cards = state.savedCards.filter((c) => c.id !== action.payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      const selectedCardId =
        state.selectedCardId === action.payload
          ? (cards[0]?.id ?? null)
          : state.selectedCardId;
      return { ...state, savedCards: cards, selectedCardId };
    }
    case 'SELECT_CARD':
      return { ...state, selectedCardId: action.payload };
    case 'SELECT_PLAN':
      return { ...state, selectedPlanId: action.payload };
    case 'OPEN_CHECKOUT':
      return { ...state, isCheckoutOpen: true, sourceTab: action.payload };
    case 'CLOSE_CHECKOUT':
      return { ...state, isCheckoutOpen: false };
    default:
      return state;
  }
}

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, {
    savedCards: loadSavedCards(),
    selectedCardId: loadSavedCards()[0]?.id ?? null,
    selectedPlanId: null,
    isCheckoutOpen: false,
    sourceTab: null,
  });

  useEffect(() => {
    if (state.selectedCardId === null && state.savedCards.length > 0) {
      dispatch({ type: 'SELECT_CARD', payload: state.savedCards[0].id });
    }
  }, [state.savedCards, state.selectedCardId]);

  const selectedCard =
    state.savedCards.find((c) => c.id === state.selectedCardId) ?? null;

  return (
    <PaymentContext.Provider
      value={{
        state,
        addCard: (card) => dispatch({ type: 'ADD_CARD', payload: card }),
        removeCard: (id) => dispatch({ type: 'REMOVE_CARD', payload: id }),
        selectCard: (id) => dispatch({ type: 'SELECT_CARD', payload: id }),
        selectPlan: (id) => dispatch({ type: 'SELECT_PLAN', payload: id }),
        openCheckout: (tab) => dispatch({ type: 'OPEN_CHECKOUT', payload: tab }),
        closeCheckout: () => dispatch({ type: 'CLOSE_CHECKOUT' }),
        selectedCard,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}
