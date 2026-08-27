/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StockCatalogView } from './components/StockCatalogView';
import { MovementsView } from './components/MovementsView';
import { ReportsView } from './components/ReportsView';
import { AlertsView } from './components/AlertsView';
import { SuppliersView } from './components/SuppliersView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { CautelasView } from './components/CautelasView';
import { ConstructionSitesView } from './components/ConstructionSitesView';

import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { MovementModal } from './components/MovementModal';
import { ProductFormModal } from './components/ProductFormModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';

import { Product, MovementType } from './types';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  FileBarChart2,
  Bell,
  Truck,
  BookOpen,
  Settings,
  Barcode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { products, alerts, isOnline } = useInventory();
  const { currentUser, userProfile, loading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementModalType, setMovementModalType] = useState<MovementType>('ENTRADA');
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | undefined>(undefined);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Quick Open Movement Helper
  const handleOpenMovementModal = (product?: Product, type?: MovementType) => {
    setSelectedProductForMovement(product);
    if (type) setMovementModalType(type);
    setIsMovementModalOpen(true);
  };

  // Quick Open Product Modal Helper
  const handleOpenProductModal = (product?: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // Handler when barcode is scanned via camera
  const handleBarcodeScanned = (code: string) => {
    const matchedProduct = products.find((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    if (matchedProduct) {
      handleOpenMovementModal(matchedProduct, 'ENTRADA');
    } else {
      if (
        window.confirm(
          `Código de barras "${code}" não cadastrado no Almoxarifado Borges & Gomes. Deseja cadastrar um novo produto agora?`
        )
      ) {
        setIsProductModalOpen(true);
      }
    }
  };

  // 1. Loading state while checking Firebase Auth session
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#070A0F] text-[#E5E7EB] flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-950/60 border border-amber-400/40">
            <Boxes className="w-9 h-9" />
          </div>
          <div>
            <h1 className="font-serif font-black text-xl text-white tracking-wider">
              BORGES & GOMES
            </h1>
            <p className="text-xs text-amber-400 font-mono mt-0.5">Centro de Comando Dark Gold</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-3">
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Sincronizando ambiente executivo...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Gateway Gate: Only authenticated users who are registered can access the app
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-[#E2E8F0] flex flex-col font-sans selection:bg-amber-500/25 selection:text-amber-300 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <Header
        activeTab={activeTab as any}
        setActiveTab={(t) => setActiveTab(t)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenMovementModal={() => handleOpenMovementModal(undefined, 'ENTRADA')}
        onOpenProductModal={() => handleOpenProductModal(undefined)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area with Framer Motion Animation */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 pt-5 pb-16 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full"
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenMovementModal={(type) => handleOpenMovementModal(undefined, type)}
                onSelectProduct={(prod) => setSelectedProductForMovement(prod)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'inventory' && (
              <StockCatalogView
                onOpenProductModal={(p) => handleOpenProductModal(p)}
                onOpenMovementModal={(p, type) => handleOpenMovementModal(p, type)}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsView
                onOpenMovementModal={(type) => handleOpenMovementModal(undefined, type)}
              />
            )}

            {activeTab === 'cautions' && <CautelasView />}

            {activeTab === 'construction-sites' && <ConstructionSitesView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'alerts' && (
              <AlertsView
                onOpenMovementModal={(p, type) => handleOpenMovementModal(p, type)}
              />
            )}

            {activeTab === 'suppliers' && <SuppliersView />}

            {activeTab === 'knowledge' && <KnowledgeBaseView />}

            {activeTab === 'settings' && <SettingsBackupView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - Dark Gold Command Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D17]/95 backdrop-blur-xl border-t border-amber-500/30 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'dashboard' ? 'text-amber-400 font-black' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'inventory' ? 'text-amber-400 font-black' : 'text-slate-400'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Estoque</span>
        </button>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-950/60 active:scale-95 transition border-2 border-[#090D17]"
        >
          <Barcode className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'movements' ? 'text-amber-400 font-black' : 'text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Movimentos</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'reports' ? 'text-amber-400 font-black' : 'text-slate-400'
          }`}
        >
          <FileBarChart2 className="w-4 h-4" />
          <span>Relatórios</span>
        </button>
      </nav>

      {/* Footer Dark Gold */}
      <footer className="mt-auto border-t border-amber-500/20 py-4 text-center text-xs text-slate-400 bg-[#070A12]/90 backdrop-blur-md relative z-10">
        <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-white tracking-wide">BORGES & GOMES</span>
            <span className="text-amber-500/60">•</span>
            <span className="text-[11px] font-mono text-amber-300/80">Centro de Comando Dark Gold v3.0</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Telemetria:{' '}
              <strong className={isOnline ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                {isOnline ? '● Firebase Cloud Firestore Conectado' : '○ Operação Local Offline'}
              </strong>
            </span>
            <span className="text-amber-500/60">•</span>
            <span className="tracking-wider uppercase text-[10px] font-medium text-slate-400">Engenharia & Rastreabilidade</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialProduct={selectedProductForMovement}
        initialType={movementModalType}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(undefined);
        }}
        initialProduct={editingProduct}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainAppContent />
      </InventoryProvider>
    </AuthProvider>
  );
}
