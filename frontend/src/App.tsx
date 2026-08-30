import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  CloudSun, 
  TrendingUp, 
  ShieldAlert, 
  Sliders, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Sprout,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import MarketSense from './components/MarketSense';

type TabType = 'dashboard' | 'crop-doctor' | 'weather' | 'market-sense' | 'risk-analysis' | 'what-if';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Sync theme class with document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crop-doctor', label: 'Crop Doctor', icon: Stethoscope },
    { id: 'weather', label: 'Weather Intel', icon: CloudSun },
    { id: 'market-sense', label: 'MarketSense', icon: TrendingUp },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders },
  ] as const;

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-[#0c0c0f] border-r border-zinc-200 dark:border-zinc-800/80 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-200 dark:border-zinc-800/80">
          <Sprout className="w-6 h-6 text-brand-500" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">FarmSight AI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false); // Close mobile sidebar on navigate
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-brand-500 border border-emerald-100 dark:border-emerald-900/30' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-500" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-500">
          <p>FarmSight Engine v1.0.0</p>
          <p className="mt-1">Pair-programmed with Antigravity</p>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#0c0c0f]/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold capitalize tracking-tight">
              {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Welcome to FarmSight Dashboard</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">Agricultural decision support powered by predictive models and market intelligence.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('market-sense')}
                    className="bg-brand-500 hover:bg-brand-600 text-white dark:text-zinc-950 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
                  >
                    View MarketSense
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Farm Area', value: '145.8 Ac', icon: Sprout, trend: '+3.4%', color: 'text-emerald-500' },
                  { label: 'Crops Monitored', value: '3 Active', icon: LayoutDashboard, trend: 'Groundnut, Cotton, Paddy', color: 'text-blue-500', isTextTrend: true },
                  { label: 'Market Mandis Active', value: '47 Mandis', icon: TrendingUp, trend: 'Daily Sync', color: 'text-amber-500', isTextTrend: true },
                  { label: 'Active Risk Alerts', value: '1 Warning', icon: AlertCircle, trend: 'Mild Pest Threat', color: 'text-rose-500', isWarning: true }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</span>
                        <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 ${kpi.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                        <div className="flex items-center gap-1.5">
                          {kpi.isWarning ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium">
                              {kpi.trend}
                            </span>
                          ) : kpi.isTextTrend ? (
                            <span className="text-xs text-zinc-405 dark:text-zinc-500 font-medium">{kpi.trend}</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {kpi.trend}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Module Previews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    tab: 'crop-doctor',
                    title: 'Crop Doctor',
                    description: 'Diagnose crop pests, diseases, and nutritional deficiencies using computer vision models.',
                    icon: Stethoscope,
                    status: 'Ready'
                  },
                  {
                    tab: 'weather',
                    title: 'Weather Intel',
                    description: 'Micro-climate hyper-local forecasts and real-time alerts tailored for crop water demand.',
                    icon: CloudSun,
                    status: 'Ready'
                  },
                  {
                    tab: 'market-sense',
                    title: 'MarketSense',
                    description: 'Daily mandi prices analysis, price comparisons, and profit estimates using national OGD datasets.',
                    icon: TrendingUp,
                    status: 'Ready'
                  },
                  {
                    tab: 'risk-analysis',
                    title: 'Risk Analysis',
                    description: 'Preemptive multi-hazard evaluation covering extreme weather, pest breakouts, and price volatility.',
                    icon: ShieldAlert,
                    status: 'Ready'
                  },
                  {
                    tab: 'what-if',
                    title: 'What-If Simulator',
                    description: 'Simulate financial outcomes based on different crop selection, transport routes, and selling dates.',
                    icon: Sliders,
                    status: 'Ready'
                  }
                ].map((module, idx) => {
                  const Icon = module.icon;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setActiveTab(module.tab as TabType)}
                      className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-brand-500 border border-emerald-100 dark:border-emerald-900/30">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-base text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-500 dark:group-hover:text-brand-500 transition-colors">{module.title}</h3>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">{module.description}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-400 dark:text-zinc-500">Status: {module.status}</span>
                        <span className="text-emerald-600 dark:text-brand-500 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* MarketSense Component */}
          {activeTab === 'market-sense' && (
            <MarketSense />
          )}

          {/* Module Placeholder Views */}
          {activeTab !== 'dashboard' && activeTab !== 'market-sense' && (
            <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-2xl mx-auto space-y-4 my-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center">
                {React.createElement(navigationItems.find(item => item.id === activeTab)?.icon || LayoutDashboard, { className: 'w-6.5 h-6.5' })}
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {navigationItems.find(item => item.id === activeTab)?.label} Module
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                The {navigationItems.find(item => item.id === activeTab)?.label} workspace structure is ready. This pane will contain the interactive charts, forms, and models once the underlying integration tasks are completed.
              </p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
