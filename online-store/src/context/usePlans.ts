import { createContext, useContext } from 'react';

export interface CreatedPlan {
  id: number;
  name: string;
  description: string;
  amount: number;
  billingCycleType: string;
  billingCyclesNumber: number;
  trialCycleType: string;
  trialCyclesNumber: number;
  locationId: number;
}

export interface PlansContextType {
  plans: CreatedPlan[];
  addPlan: (plan: CreatedPlan) => void;
  removePlan: (id: number) => void;
}

export const PlansContext = createContext<PlansContextType | null>(null);

export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans must be used within PlansProvider');
  return ctx;
}
