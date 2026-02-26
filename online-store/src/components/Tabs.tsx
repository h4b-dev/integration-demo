import './Tabs.css';

export type TabId = 'products' | 'subscriptions' | 'checkout';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  badge?: string;
}

const tabs: Tab[] = [
  { id: 'products', label: 'Products', icon: '📦', badge: 'Payment API' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '🔄', badge: 'Subscription API' },
  { id: 'checkout', label: 'Checkout Store', icon: '🔗', badge: 'Payment Link API' },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs-wrapper">
      <div className="tabs-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
