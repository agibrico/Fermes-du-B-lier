import React, { useState, useEffect } from 'react';
import { 
  PoultryBatch, 
  StockItem, 
  StockMovement, 
  FeedFormula, 
  FeedManufacturingLog, 
  HealthProtocolItem, 
  TechnicalParams, 
  CuttingYield,
  AppBackupData,
  IngredientDefinition
} from './types';
import { 
  TECHNICAL_PARAMS_DEFAULT, 
  CUTTING_YIELDS_STANDARD, 
  FEED_FORMULAS_PDF, 
  STOCK_ITEMS_DEFAULT, 
  HEALTH_PROTOCOLS_DEFAULT,
  FEED_PROGRAM_STANDARD,
  INGREDIENTS_LIBRARY_DEFAULT
} from './data';
import { getTodayDateStr, formatLocalDate } from './utils/dateUtils';
import Navigation, { AppSpace } from './components/Navigation';
import DashboardView from './components/DashboardView';
import BatchesView from './components/BatchesView';
import DailyLogView from './components/DailyLogView';
import FeedingView from './components/FeedingView';
import StocksView from './components/StocksView';
import HealthView from './components/HealthView';
import WeighingsView from './components/WeighingsView';
import SalesExpensesView from './components/SalesExpensesView';
import ReportsView from './components/ReportsView';
import ParametersView from './components/ParametersView';
import SaaSHeader from './components/SaaSHeader';
import AuthModal from './components/AuthModal';
import CreateOrgModal from './components/CreateOrgModal';
import { api, AuthUser, UserOrganization, FarmRecord } from './services/api';

// Helper to generate realistic past dates without UTC shift
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatLocalDate(d);
};

// Seed demo batches
const createSeedBatches = (): PoultryBatch[] => [
  {
    id: 'batch_alpha_seed',
    name: 'Lot Alpha - 150 Sujets (Chrono)',
    initialSize: 150,
    startDate: getPastDateStr(14), // Jour 15 aujourd'hui (Croissance)
    receptionAgeDays: 1,
    strain: 'Cobb 500',
    hatcheryName: 'Couvoir Ivoire Pro',
    feedProgramId: FEED_PROGRAM_STANDARD.id,
    hasAdoptedNewProgram: true,
    targetWeightMinGrams: 2100,
    targetWeightMaxGrams: 2200,
    targetAgeDays: 35,
    mortalities: [
      { id: 'm1', date: getPastDateStr(12), count: 2, cause: 'Faiblesse transport' },
      { id: 'm2', date: getPastDateStr(6), count: 1, cause: 'Asphyxie' }
    ],
    weights: [
      { id: 'w1', day: 1, weight: 42, date: getPastDateStr(14), ageDaysCalculated: 1 },
      { id: 'w2', day: 7, weight: 195, date: getPastDateStr(8), birdsWeighedCount: 15, ageDaysCalculated: 7 },
      { id: 'w3', day: 14, weight: 520, date: getPastDateStr(1), birdsWeighedCount: 20, ageDaysCalculated: 14 }
    ],
    flockMovements: [],
    dailyLogs: [
      { id: 'dl1', batchId: 'batch_alpha_seed', date: getPastDateStr(1), ageDays: 14, mortalityCount: 0, feedDistributedKg: 18.5, feedDistributedType: 'Aliment Croissance', averageWeightGrams: 520, birdsWeighedCount: 20, healthTreatmentsGiven: 'Vaccin Gumboro réalisé', operator: 'Éleveur en chef' }
    ],
    sales: [],
    expenses: [
      { id: 'e1', date: getPastDateStr(14), category: 'Poussins', description: '150 poussins Cobb 500', amountFcfa: 150 * 630 },
      { id: 'e2', date: getPastDateStr(14), category: 'Litière', description: '3 sacs de copeaux dépoussiérés', amountFcfa: 6000 }
    ],
    healthLogs: [
      { id: 'hl1', protocolItemId: 'prot_hb1', batchId: 'batch_alpha_seed', category: 'vaccin', productName: 'Vaccin HB1 / H120', lotManufacturer: 'HB-0926', date: getPastDateStr(14), effectiveAgeDays: 1, birdsTreatedCount: 150, dosesOrQuantityUsed: 150, unit: 'doses', operator: 'Vétérinaire', conservationConditionsChecked: true, withdrawalPeriodDays: 0, withdrawalEndDate: getPastDateStr(14), isWithdrawalActive: false, status: 'Réalisé' },
      { id: 'hl2', protocolItemId: 'prot_gumboro_1', batchId: 'batch_alpha_seed', category: 'vaccin', productName: 'Vaccin Gumboro Intermédiaire', lotManufacturer: 'GUM-44B', date: getPastDateStr(1), effectiveAgeDays: 14, birdsTreatedCount: 147, dosesOrQuantityUsed: 150, unit: 'doses', operator: 'Éleveur', conservationConditionsChecked: true, withdrawalPeriodDays: 0, withdrawalEndDate: getPastDateStr(1), isWithdrawalActive: false, status: 'Réalisé' }
    ],
    status: 'active'
  }
];

export default function App() {
  const [currentSpace, setCurrentSpace] = useState<AppSpace>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>('batch_alpha_seed');

  // Midnight date ticker
  const [currentDateStr, setCurrentDateStr] = useState<string>(getTodayDateStr());
  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayDateStr();
      if (today !== currentDateStr) {
        setCurrentDateStr(today);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // Persisted state: Batches
  const [batches, setBatches] = useState<PoultryBatch[]>(() => {
    const saved = localStorage.getItem('belier_batches_v2');
    return saved ? JSON.parse(saved) : createSeedBatches();
  });

  // Persisted state: Stock Items
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('belier_stock_items_v2');
    return saved ? JSON.parse(saved) : STOCK_ITEMS_DEFAULT;
  });

  // Persisted state: Stock Movements
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('belier_stock_movements_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Persisted state: Feed Formulas
  const [formulas, setFormulas] = useState<FeedFormula[]>(() => {
    const saved = localStorage.getItem('belier_formulas_v2');
    return saved ? JSON.parse(saved) : FEED_FORMULAS_PDF;
  });

  // Persisted state: Manufacturing Logs
  const [manufacturingLogs, setManufacturingLogs] = useState<FeedManufacturingLog[]>(() => {
    const saved = localStorage.getItem('belier_mfg_logs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Persisted state: Health Protocols
  const [healthProtocols, setHealthProtocols] = useState<HealthProtocolItem[]>(() => {
    const saved = localStorage.getItem('belier_health_protocols_v2');
    return saved ? JSON.parse(saved) : HEALTH_PROTOCOLS_DEFAULT;
  });

  // Persisted state: Technical Params
  const [technicalParams, setTechnicalParams] = useState<TechnicalParams>(() => {
    const saved = localStorage.getItem('belier_technical_params_v2');
    return saved ? JSON.parse(saved) : TECHNICAL_PARAMS_DEFAULT;
  });

  // Persisted state: Cutting Yields
  const [cuttingYields, setCuttingYields] = useState<CuttingYield[]>(() => {
    const saved = localStorage.getItem('belier_cutting_yields_v2');
    return saved ? JSON.parse(saved) : CUTTING_YIELDS_STANDARD;
  });

  // Persisted state: Ingredients Library
  const [ingredientsLibrary, setIngredientsLibrary] = useState<IngredientDefinition[]>(() => {
    const saved = localStorage.getItem('belier_ingredients_lib_v1');
    return saved ? JSON.parse(saved) : INGREDIENTS_LIBRARY_DEFAULT;
  });

  const [lastBackupDate, setLastBackupDate] = useState<string | undefined>(() => {
    return localStorage.getItem('belier_last_backup_date') || undefined;
  });

  // --- SAAS STATE ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getUser());
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => api.getActiveOrgId());
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [saasBatches, setSaasBatches] = useState<PoultryBatch[]>([]);
  const [isSaasLoading, setIsSaasLoading] = useState(false);
  const [saasNotice, setSaasNotice] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  const activeFarm = farms.find(f => f.id === activeFarmId) || farms[0] || null;
  const isSaasMode = Boolean(currentUser && activeOrgId);
  const displayedBatches = isSaasMode ? saasBatches : batches;

  // Load data from SaaS API for active organization
  const loadSaasData = async (orgId: string) => {
    setIsSaasLoading(true);
    setSaasNotice(null);
    try {
      const [farmsRes, batchesRes] = await Promise.all([
        api.getFarms(orgId),
        api.getBatches(orgId)
      ]);

      if (farmsRes.data?.farms) {
        setFarms(farmsRes.data.farms);
        if (farmsRes.data.farms.length > 0) {
          setActiveFarmId(farmsRes.data.farms[0].id);
        }
      }

      if (batchesRes.data?.batches) {
        setSaasBatches(batchesRes.data.batches);
        if (batchesRes.data.batches.length > 0) {
          setSelectedBatchId(batchesRes.data.batches[0].id);
        } else {
          setSelectedBatchId(null);
        }
      }
    } catch (err: any) {
      console.error('[SAAS_LOAD_ERROR]', err);
    } finally {
      setIsSaasLoading(false);
    }
  };

  // Initialize SaaS user on load
  useEffect(() => {
    const unsub = api.onAuthChange(user => {
      setCurrentUser(user);
    });

    if (api.getToken()) {
      api.getMe().then(res => {
        if (res.data) {
          setCurrentUser(res.data.user);
          setOrganizations(res.data.organizations || []);
          if (res.data.organizations && res.data.organizations.length > 0) {
            const orgToSet = activeOrgId && res.data.organizations.some(o => o.id === activeOrgId)
              ? activeOrgId
              : res.data.organizations[0].id;
            setActiveOrgId(orgToSet);
            api.setActiveOrgId(orgToSet);
            loadSaasData(orgToSet);
          }
        }
      });
    }

    return () => unsub();
  }, []);

  const handleSelectOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    api.setActiveOrgId(orgId);
    setSaasBatches([]); // Purge memory cache to prevent cross-leakage
    loadSaasData(orgId);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setOrganizations([]);
    setActiveOrgId(null);
    setFarms([]);
    setSaasBatches([]);
    // Local batches remain intact
  };

  // Local storage synchronization (Mode Local Uniquement)
  useEffect(() => {
    if (!isSaasMode) {
      localStorage.setItem('belier_batches_v2', JSON.stringify(batches));
    }
  }, [batches, isSaasMode]);

  useEffect(() => {
    localStorage.setItem('belier_stock_items_v2', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('belier_stock_movements_v2', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('belier_formulas_v2', JSON.stringify(formulas));
  }, [formulas]);

  useEffect(() => {
    localStorage.setItem('belier_mfg_logs_v2', JSON.stringify(manufacturingLogs));
  }, [manufacturingLogs]);

  useEffect(() => {
    localStorage.setItem('belier_health_protocols_v2', JSON.stringify(healthProtocols));
  }, [healthProtocols]);

  useEffect(() => {
    localStorage.setItem('belier_technical_params_v2', JSON.stringify(technicalParams));
  }, [technicalParams]);

  useEffect(() => {
    localStorage.setItem('belier_cutting_yields_v2', JSON.stringify(cuttingYields));
  }, [cuttingYields]);

  useEffect(() => {
    localStorage.setItem('belier_ingredients_lib_v1', JSON.stringify(ingredientsLibrary));
  }, [ingredientsLibrary]);

  // Mutations
  const handleAddBatch = async (newB: PoultryBatch) => {
    if (isSaasMode && activeOrgId) {
      try {
        const payload = {
          ...newB,
          farmId: activeFarmId || farms[0]?.id
        };
        const res = await api.createBatch(activeOrgId, payload);
        if (res.data?.batch) {
          setSaasBatches(prev => [res.data!.batch, ...prev]);
          setSelectedBatchId(res.data.batch.id);
        } else if (res.error) {
          console.error(`Erreur création lot SaaS: ${res.error}`);
        }
      } catch (err) {
        console.error('Failed to create SaaS batch:', err);
      }
    } else {
      setBatches(prev => [newB, ...prev]);
      setSelectedBatchId(newB.id);
    }
  };

  const handleUpdateBatch = async (updatedB: PoultryBatch) => {
    if (isSaasMode && activeOrgId) {
      setSaasBatches(prev => prev.map(b => b.id === updatedB.id ? updatedB : b));
      try {
        await api.updateBatch(activeOrgId, updatedB.id, updatedB);
      } catch (err) {
        console.error('Failed to update SaaS batch:', err);
      }
    } else {
      setBatches(prev => prev.map(b => b.id === updatedB.id ? updatedB : b));
    }
  };

  const handleSoftDeleteBatch = async (id: string) => {
    if (isSaasMode && activeOrgId) {
      setSaasBatches(prev => prev.map(b => b.id === id ? { ...b, deletedAt: new Date().toISOString() } : b));
      try {
        await api.updateBatch(activeOrgId, id, { status: 'archived', deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error('Failed to soft delete SaaS batch:', err);
      }
    } else {
      setBatches(prev => prev.map(b => b.id === id ? { ...b, deletedAt: new Date().toISOString() } : b));
    }
  };

  const handleRestoreBatch = async (id: string) => {
    if (isSaasMode && activeOrgId) {
      setSaasBatches(prev => prev.map(b => b.id === id ? { ...b, deletedAt: undefined } : b));
      try {
        await api.updateBatch(activeOrgId, id, { status: 'active', deletedAt: null });
      } catch (err) {
        console.error('Failed to restore SaaS batch:', err);
      }
    } else {
      setBatches(prev => prev.map(b => b.id === id ? { ...b, deletedAt: undefined } : b));
    }
  };

  const handlePermanentDeleteBatch = async (id: string) => {
    if (isSaasMode && activeOrgId) {
      setSaasBatches(prev => prev.filter(b => b.id !== id));
      try {
        await api.deleteBatch(activeOrgId, id);
      } catch (err) {
        console.error('Failed to permanent delete SaaS batch:', err);
      }
    } else {
      setBatches(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAddStockMovement = (mov: StockMovement) => {
    setStockMovements(prev => [mov, ...prev]);
  };

  const handleAddManufacturingLog = (log: FeedManufacturingLog) => {
    setManufacturingLogs(prev => [log, ...prev]);
  };

  // Reset empty farm
  const handleResetEmptyFarm = () => {
    setBatches([]);
    setManufacturingLogs([]);
    setStockMovements([]);
    localStorage.removeItem('belier_batches_v2');
    setSelectedBatchId(null);
  };

  // Reset certified demo data
  const handleResetDemoData = () => {
    setBatches(createSeedBatches());
    setStockItems(STOCK_ITEMS_DEFAULT);
    setFormulas(FEED_FORMULAS_PDF);
    setHealthProtocols(HEALTH_PROTOCOLS_DEFAULT);
    setTechnicalParams(TECHNICAL_PARAMS_DEFAULT);
    setCuttingYields(CUTTING_YIELDS_STANDARD);
    setSelectedBatchId('batch_alpha_seed');
  };

  // Import full backup
  const handleImportBackup = (data: AppBackupData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setBatches(data.batches || []);
      if (data.stockItems && data.stockItems.length > 0) setStockItems(data.stockItems);
      if (data.formulas && data.formulas.length > 0) setFormulas(data.formulas);
      if (data.technicalParams) setTechnicalParams(data.technicalParams);
      if (data.cuttingYields) setCuttingYields(data.cuttingYields);
    } else {
      // Merge batches
      setBatches(prev => {
        const existingIds = new Set(prev.map(b => b.id));
        const toAdd = (data.batches || []).filter(b => !existingIds.has(b.id));
        return [...prev, ...toAdd];
      });
    }
    const now = new Date().toISOString();
    setLastBackupDate(now);
    localStorage.setItem('belier_last_backup_date', now);
  };

  // Alerts counts
  const lowStockCount = stockItems.filter(s => s.quantityOnHand <= s.reorderAlertLevel).length;

  return (
    <div id="main-application-viewport" className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans pb-16 lg:pb-0">
      {/* SaaS Multi-Tenant Organization Header */}
      <SaaSHeader
        currentUser={currentUser}
        organizations={organizations}
        activeOrgId={activeOrgId}
        activeFarm={activeFarm}
        farms={farms}
        onSelectOrg={handleSelectOrg}
        onSelectFarm={setActiveFarmId}
        onCreateOrgClick={() => setShowCreateOrgModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenMailbox={() => setShowAuthModal(true)}
      />

      {/* 10-Space Top and Mobile Navigation */}
      <Navigation
        currentSpace={currentSpace}
        onSelectSpace={setCurrentSpace}
        currentDateStr={currentDateStr}
        lowStockCount={lowStockCount}
      />

      {/* SaaS Loading / Sync Banner */}
      {isSaasLoading && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Synchronisation des lots PostgreSQL en cours...</span>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {currentSpace === 'dashboard' && (
          <DashboardView
            batches={displayedBatches}
            stockItems={stockItems}
            healthProtocols={healthProtocols}
            technicalParams={technicalParams}
            cuttingYields={cuttingYields}
            currentDateStr={currentDateStr}
            onNavigate={setCurrentSpace}
            onSelectBatch={(id) => {
              setSelectedBatchId(id);
              setCurrentSpace('batches');
            }}
            lastBackupDate={lastBackupDate}
          />
        )}

        {currentSpace === 'batches' && (
          <BatchesView
            batches={displayedBatches}
            onAddBatch={handleAddBatch}
            onUpdateBatch={handleUpdateBatch}
            onSoftDeleteBatch={handleSoftDeleteBatch}
            onRestoreBatch={handleRestoreBatch}
            onPermanentDeleteBatch={handlePermanentDeleteBatch}
            technicalParams={technicalParams}
            cuttingYields={cuttingYields}
            currentDateStr={currentDateStr}
            selectedBatchId={selectedBatchId}
            onSelectBatchId={setSelectedBatchId}
          />
        )}

        {currentSpace === 'daily_log' && (
          <DailyLogView
            batches={displayedBatches}
            onUpdateBatch={handleUpdateBatch}
            currentDateStr={currentDateStr}
            selectedBatchId={selectedBatchId}
            onSelectBatchId={setSelectedBatchId}
          />
        )}

        {currentSpace === 'feeding' && (
          <FeedingView
            formulas={formulas}
            onUpdateFormulas={setFormulas}
            stockItems={stockItems}
            onUpdateStockItems={setStockItems}
            manufacturingLogs={manufacturingLogs}
            onAddManufacturingLog={handleAddManufacturingLog}
            currentDateStr={currentDateStr}
            batches={displayedBatches}
            onUpdateBatch={handleUpdateBatch}
            ingredientsLibrary={ingredientsLibrary}
            onUpdateIngredientsLibrary={setIngredientsLibrary}
          />
        )}

        {currentSpace === 'stocks' && (
          <StocksView
            stockItems={stockItems}
            onUpdateStockItems={setStockItems}
            stockMovements={stockMovements}
            onAddStockMovement={handleAddStockMovement}
            currentDateStr={currentDateStr}
          />
        )}

        {currentSpace === 'health' && (
          <HealthView
            batches={displayedBatches}
            onUpdateBatch={handleUpdateBatch}
            healthProtocols={healthProtocols}
            onUpdateHealthProtocols={setHealthProtocols}
            currentDateStr={currentDateStr}
            selectedBatchId={selectedBatchId}
            onSelectBatchId={setSelectedBatchId}
          />
        )}

        {currentSpace === 'weighings' && (
          <WeighingsView
            batches={displayedBatches}
            onUpdateBatch={handleUpdateBatch}
            currentDateStr={currentDateStr}
            selectedBatchId={selectedBatchId}
            onSelectBatchId={setSelectedBatchId}
          />
        )}

        {currentSpace === 'sales_expenses' && (
          <SalesExpensesView
            batches={displayedBatches}
            onUpdateBatch={handleUpdateBatch}
            cuttingYields={cuttingYields}
            currentDateStr={currentDateStr}
            selectedBatchId={selectedBatchId}
            onSelectBatchId={setSelectedBatchId}
          />
        )}

        {currentSpace === 'reports' && (
          <ReportsView
            batches={displayedBatches}
            stockItems={stockItems}
            manufacturingLogs={manufacturingLogs}
            formulas={formulas}
            technicalParams={technicalParams}
            cuttingYields={cuttingYields}
            onImportBackup={handleImportBackup}
            onResetEmptyFarm={handleResetEmptyFarm}
            onResetDemoData={handleResetDemoData}
            currentDateStr={currentDateStr}
          />
        )}

        {currentSpace === 'parameters' && (
          <ParametersView
            technicalParams={technicalParams}
            onUpdateTechnicalParams={setTechnicalParams}
            cuttingYields={cuttingYields}
            onUpdateCuttingYields={setCuttingYields}
          />
        )}
      </main>

      {/* SaaS Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, orgs) => {
          setCurrentUser(user);
          setOrganizations(orgs);
          if (orgs.length > 0) {
            handleSelectOrg(orgs[0].id);
          }
        }}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        onCreated={(newOrg) => {
          setOrganizations(prev => [newOrg, ...prev]);
          handleSelectOrg(newOrg.id);
        }}
      />
    </div>
  );
}
