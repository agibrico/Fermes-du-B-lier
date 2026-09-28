import React, { useState, useEffect } from 'react';
import { PoultryBatch, TechnicalParams, CuttingYield } from './types';
import { TECHNICAL_PARAMS_DEFAULT, CUTTING_YIELDS_STANDARD } from './data';
import WelcomeScreen from './components/WelcomeScreen';
import FarmerDashboard from './components/FarmerDashboard';
import AdminDashboard from './components/AdminDashboard';

// Helper to calculate date relative to today
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Initial realistic seed data for a stellar, plug-and-play experience
const SEED_BATCHES: PoultryBatch[] = [
  {
    id: 'batch_seed_active',
    name: 'Lot Alpha - 150 Sujets (Chrono)',
    initialSize: 150,
    startDate: getPastDateStr(14), // Started 14 days ago, so today is Day 15 (first day of Croissance)
    mortalities: [
      { date: getPastDateStr(12), count: 2 },
      { date: getPastDateStr(6), count: 1 }
    ],
    weights: [
      { day: 1, weight: 42, date: getPastDateStr(14) },
      { day: 10, weight: 315, date: getPastDateStr(4) },
      { day: 14, weight: 565, date: getPastDateStr(0) }
    ],
    feedPreparations: [
      { id: 'feed_s1', date: getPastDateStr(14), phase: 'Prédémarrage', quantityKg: 45, costFcfa: 18000 },
      { id: 'feed_s2', date: getPastDateStr(4), phase: 'Démarrage', quantityKg: 45, costFcfa: 12825 }
    ],
    completedSanitaryTasks: [
      { day: 1, completed: true, completedAt: getPastDateStr(14) },
      { day: 4, completed: true, completedAt: getPastDateStr(11) },
      { day: 6, completed: true, completedAt: getPastDateStr(9) },
      { day: 11, completed: true, completedAt: getPastDateStr(4) },
      { day: 14, completed: true, completedAt: getPastDateStr(1) }
    ],
    status: 'active'
  },
  {
    id: 'batch_seed_completed',
    name: 'Lot Bêta - Rétrospective 200 têtes',
    initialSize: 200,
    startDate: getPastDateStr(45),
    mortalities: [
      { date: getPastDateStr(43), count: 3 },
      { date: getPastDateStr(35), count: 1 },
      { date: getPastDateStr(20), count: 2 }
    ],
    weights: [
      { day: 1, weight: 40, date: getPastDateStr(45) },
      { day: 10, weight: 305, date: getPastDateStr(35) },
      { day: 14, weight: 550, date: getPastDateStr(31) },
      { day: 28, weight: 1510, date: getPastDateStr(17) },
      { day: 35, weight: 2410, date: getPastDateStr(10) }
    ],
    feedPreparations: [
      { id: 'feed_s3', date: getPastDateStr(45), phase: 'Prédémarrage', quantityKg: 90, costFcfa: 36000 },
      { id: 'feed_s4', date: getPastDateStr(35), phase: 'Démarrage', quantityKg: 90, costFcfa: 25650 },
      { id: 'feed_s5', date: getPastDateStr(31), phase: 'Croissance', quantityKg: 320, costFcfa: 91200 },
      { id: 'feed_s6', date: getPastDateStr(17), phase: 'Finition', quantityKg: 200, costFcfa: 57000 }
    ],
    completedSanitaryTasks: [
      { day: 1, completed: true, completedAt: getPastDateStr(45) },
      { day: 4, completed: true, completedAt: getPastDateStr(42) },
      { day: 6, completed: true, completedAt: getPastDateStr(40) },
      { day: 11, completed: true, completedAt: getPastDateStr(35) },
      { day: 14, completed: true, completedAt: getPastDateStr(32) },
      { day: 17, completed: true, completedAt: getPastDateStr(29) },
      { day: 20, completed: true, completedAt: getPastDateStr(26) },
      { day: 21, completed: true, completedAt: getPastDateStr(25) },
      { day: 28, completed: true, completedAt: getPastDateStr(18) }
    ],
    status: 'completed',
    completionDate: getPastDateStr(10),
    soldRevenue: 816352 // 194 remaining birds * simulated carcass cut value
  }
];

export default function App() {
  // Current active workspace role selection
  const [activeRole, setActiveRole] = useState<'admin' | 'farmer' | null>(null);

  // Core global states, persisted via Local Storage
  const [batches, setBatches] = useState<PoultryBatch[]>(() => {
    const saved = localStorage.getItem('belier_poultry_batches');
    return saved ? JSON.parse(saved) : SEED_BATCHES;
  });

  const [technicalParams, setTechnicalParams] = useState<TechnicalParams>(() => {
    const saved = localStorage.getItem('belier_technical_params');
    return saved ? JSON.parse(saved) : TECHNICAL_PARAMS_DEFAULT;
  });

  const [cuttingYields, setCuttingYields] = useState<CuttingYield[]>(() => {
    const saved = localStorage.getItem('belier_cutting_yields');
    return saved ? JSON.parse(saved) : CUTTING_YIELDS_STANDARD;
  });

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('belier_poultry_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('belier_technical_params', JSON.stringify(technicalParams));
  }, [technicalParams]);

  useEffect(() => {
    localStorage.setItem('belier_cutting_yields', JSON.stringify(cuttingYields));
  }, [cuttingYields]);

  // Handle batch mutations
  const handleAddBatch = (newBatch: PoultryBatch) => {
    setBatches((prev) => [newBatch, ...prev]);
  };

  const handleUpdateBatch = (updatedBatch: PoultryBatch) => {
    setBatches((prev) => prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b)));
  };

  const handleDeleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  // Quick stats for Welcome Screen
  const activeBatchCount = batches.filter((b) => b.status === 'active').length;
  const totalBirdsUnderFollowUp = batches
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => {
      const mortalitiesCount = b.mortalities.reduce((s, m) => s + m.count, 0);
      return sum + (b.initialSize - mortalitiesCount);
    }, 0);

  return (
    <div id="main-application-viewport" className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
      {activeRole === null && (
        <WelcomeScreen
          onSelectRole={setActiveRole}
          activeBatchCount={activeBatchCount}
          totalBirds={totalBirdsUnderFollowUp}
        />
      )}

      {activeRole === 'farmer' && (
        <FarmerDashboard
          batches={batches}
          onAddBatch={handleAddBatch}
          onUpdateBatch={handleUpdateBatch}
          onDeleteBatch={handleDeleteBatch}
          onBack={() => setActiveRole(null)}
          technicalParams={technicalParams}
        />
      )}

      {activeRole === 'admin' && (
        <AdminDashboard
          batches={batches}
          technicalParams={technicalParams}
          onUpdateTechnicalParams={setTechnicalParams}
          cuttingYields={cuttingYields}
          onUpdateCuttingYields={setCuttingYields}
          onBack={() => setActiveRole(null)}
        />
      )}
    </div>
  );
}
