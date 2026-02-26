import { useState } from 'react';
import AdminPlansTab from './AdminPlansTab';
import ClientPlansTab from './ClientPlansTab';
import './TabPage.css';

type SubTab = 'admin' | 'client';

export default function SubscriptionsTab() {
  const [subTab, setSubTab] = useState<SubTab>('admin');

  return (
    <div className="tab-page">
      <div className="tab-page-header">
        <div>
          <h2 className="tab-page-title">Subscriptions</h2>
          <p className="tab-page-subtitle">Recurring billing · Processed via Subscription API</p>
        </div>
        <div className="tab-api-badge">Subscription API</div>
      </div>

      {/* Sub-tab toggle */}
      <div className="interval-toggle">
        <button
          className={`interval-btn ${subTab === 'admin' ? 'active' : ''}`}
          onClick={() => setSubTab('admin')}
        >
          Admin
        </button>
        <button
          className={`interval-btn ${subTab === 'client' ? 'active' : ''}`}
          onClick={() => setSubTab('client')}
        >
          Client
        </button>
      </div>

      {subTab === 'admin'  && <AdminPlansTab />}
      {subTab === 'client' && <ClientPlansTab />}
    </div>
  );
}
