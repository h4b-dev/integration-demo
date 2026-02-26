import { createContext, useContext, useState, type ReactNode } from 'react';

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

interface PlansContextType {
  plans: CreatedPlan[];
  addPlan: (plan: CreatedPlan) => void;
  removePlan: (id: number) => void;
}

const PlansContext = createContext<PlansContextType | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<CreatedPlan[]>([]);
  const addPlan = (plan: CreatedPlan) => setPlans((prev) => [...prev, plan]);
  const removePlan = (id: number) => setPlans((prev) => prev.filter((p) => p.id !== id));
  return (
    <PlansContext.Provider value={{ plans, addPlan, removePlan }}>
      {children}
    </PlansContext.Provider>
  );
}

export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans must be used within PlansProvider');
  return ctx;
}
