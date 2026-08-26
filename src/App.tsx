/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
      // Open movement directly or view
      handleOpenMovementModal(matchedProduct, 'ENTRADA');
    } else {
      // Offer to register new product with this barcode
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
      <div className="min-h-screen w-full bg-[#0E1114] text-[#E5E7EB] flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-900/40">
            <Boxes className="w-9 h-9" />
          </div>
          <div>
            <h1 className="font-serif font-black text-xl text-white tracking-wider">
              BORGES & GOMES
            </h1>
            <p className="text-xs text-amber-400 font-mono mt-0.5">Almoxarifado Inteligente</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-3">
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Verificando credenciais Firebase...</span>
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
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#0F1113] text-[#1C1E21] dark:text-[#E5E7EB] transition-colors flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Header */}
      <Header
        activeTab={activeTab as any}
        setActiveTab={(t) => setActiveTab(t)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenMovementModal={() => handleOpenMovementModal(undefined, 'ENTRADA')}
        onOpenProductModal={() => handleOpenProductModal(undefined)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
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

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'alerts' && (
          <AlertsView
            onOpenMovementModal={(p, type) => handleOpenMovementModal(p, type)}
          />
        )}

        {activeTab === 'suppliers' && <SuppliersView />}

        {activeTab === 'knowledge' && <KnowledgeBaseView />}

        {activeTab === 'settings' && <SettingsBackupView />}
      </main>

      {/* Bottom Navigation for Small Devices */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#14171B]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#262B33] px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'dashboard' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'inventory' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Estoque</span>
        </button>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/40 active:scale-95 transition border-2 border-[#FFFFFF] dark:border-[#0F1113]"
        >
          <Barcode className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'movements' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Movimentos</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition ${
            activeTab === 'reports' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileBarChart2 className="w-4 h-4" />
          <span>Relatórios</span>
        </button>
      </nav>

      {/* Footer / Offline Status Indicator */}
      <footer className="mt-auto border-t border-slate-200 dark:border-[#22272E] py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#121519]/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-800 dark:text-slate-200 tracking-wide">BORGES & GOMES</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] font-mono text-slate-500">Almoxarifado Enterprise v2.4</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Rede:{' '}
              <strong className={isOnline ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-amber-600 dark:text-amber-400 font-mono'}>
                {isOnline ? '● Online & Sincronizado' : '○ Offline Local'}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="tracking-wider uppercase text-[10px] font-medium text-slate-500">Rastreabilidade & Curva ABC</span>
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
