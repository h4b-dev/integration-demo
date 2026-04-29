import { useState, type ReactNode } from 'react';
import { PlansContext, type CreatedPlan } from './usePlans';

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
