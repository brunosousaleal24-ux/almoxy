import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  X,
  Flashlight,
  RefreshCw,
  Barcode,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/exportUtils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product, actionType?: 'ENTRADA' | 'SAIDA') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { products, getProductByBarcodeOrSku, playBeepSound } = useInventory();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanningActive, setScanningActive] = useState(true);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedProduct(null);
      setManualCode('');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        stopCamera();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setCameraError('Câmera não suportada neste navegador ou ambiente iFrame.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setHasCameraPermission(true);
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      setHasCameraPermission(false);
      setCameraError('Permissão da câmera não concedida ou dispositivo sem câmera ativa. Utilize o leitor manual ou atalhos abaixo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { torch?: boolean };
      if (capabilities && capabilities.torch) {
        const nextState = !torchOn;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      }
    } catch {
      // Ignore torch error if unsupported
    }
  };

  const handleDetectedCode = (code: string) => {
    const found = getProductByBarcodeOrSku(code);
    if (found) {
      playBeepSound('success');
      setScannedProduct(found);
      setScanningActive(false);
    } else {
      playBeepSound('warning');
      setManualCode(code);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
  };

  const resetScan = () => {
    setScannedProduct(null);
    setManualCode('');
    setScanningActive(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#262B33] bg-slate-50 dark:bg-[#121519]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-[#F9FAFB]">
                  Leitor de Código de Barras & QR Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Borges & Gomes Almoxarifado • Leitura por Câmera ou Bipagem
                </p>
              </div>
            </div>
            <button
              id="btn-close-scanner-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20252D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Viewfinder / Camera Area */}
          <div className="p-6 space-y-4 font-sans">
            {!scannedProduct ? (
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#0D0F12] flex items-center justify-center border border-[#282E37]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`}
                  />

                  {/* Fallback Viewfinder or overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    {/* Targeting Frame Box */}
                    <div className="relative w-64 h-36 border-2 border-dashed border-amber-400/80 rounded-lg flex items-center justify-center bg-amber-500/5 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                      {/* Laser scanner line animation */}
                      {scanningActive && (
                        <div className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse animate-bounce" />
                      )}
                      <p className="text-[10px] text-amber-200 font-mono tracking-widest bg-[#14171A]/90 border border-amber-500/30 px-2.5 py-0.5 rounded uppercase">
                        ALINHE O CÓDIGO AQUI
                      </p>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0D0F12]/95 text-slate-300">
                      <Camera className="w-10 h-10 text-amber-500/60 mb-2" />
                      <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                      <span className="text-[11px] text-amber-400 mt-2 font-medium">
                        Dica: Digite o código ou clique nos botões de bipagem rápida abaixo
                      </span>
                    </div>
                  )}

                  {/* Camera Control Overlays */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      id="btn-toggle-camera-facing"
                      onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                      className="p-2 bg-[#16191D]/90 text-white rounded-lg hover:bg-[#222831] backdrop-blur border border-[#2D3540] text-xs flex items-center gap-1"
                      title="Alternar Câmera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-toggle-torch"
                      onClick={toggleTorch}
                      className={`p-2 rounded-lg backdrop-blur border text-xs flex items-center gap-1 ${
                        torchOn
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-[#16191D]/90 text-white border-[#2D3540] hover:bg-[#222831]'
                      }`}
                      title="Lanterna / Flash"
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Manual Code Input / USB Scanner Input */}
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-barcode-manual"
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Digitar código de barras (EAN), SKU ou ID..."
                      className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <button
                    id="btn-submit-manual-barcode"
                    type="submit"
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition active:scale-95"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </form>

                {/* Quick Test Barcode Pills (To immediately simulate real scanning from Borges e Gomes inventory) */}
                <div className="space-y-1.5">
                  <p className="text-xs font-serif font-bold text-slate-500 dark:text-slate-400">
                    Bipagem Rápida de Teste (Simular Leitor Óptico):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {products.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleDetectedCode(p.barcode)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-50 dark:bg-[#1C2128] dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2C333E] hover:border-amber-500/40 rounded-lg transition text-left flex items-center gap-1.5"
                      >
                        <Barcode className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{p.barcode}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono">({p.sku})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Product Found Card */
              <div className="space-y-4">
                <div className="p-4 bg-[#14171A] border border-emerald-500/30 rounded-xl shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-serif font-bold text-sm">
                      <CheckCircle className="w-5 h-5" />
                      Produto Identificado no Almoxarifado
                    </div>
                    <span className="font-mono text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-bold">
                      {scannedProduct.barcode}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-serif font-bold text-slate-900 dark:text-[#F9FAFB] text-lg">
                      {scannedProduct.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                      SKU: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{scannedProduct.sku}</span> • Categoria: {scannedProduct.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#262B33] text-center">
                    <div className="p-2.5 bg-[#1C2128] rounded-xl border border-[#2B323D]">
                      <span className="text-[10px] text-slate-400 block font-serif uppercase">Estoque Atual</span>
                      <span className={`text-base font-mono font-bold ${
                        scannedProduct.currentStock <= scannedProduct.minStock
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}>
                        {scannedProduct.currentStock} {scannedProduct.unit}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#1C2128] rounded-xl border border-[#2B323D]">
                      <span className="text-[10px] text-slate-400 block font-serif uppercase">Estoque Mínimo</span>
                      <span className="text-base font-mono font-semibold text-slate-200">
                        {scannedProduct.minStock} {scannedProduct.unit}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#1C2128] rounded-xl border border-[#2B323D]">
                      <span className="text-[10px] text-slate-400 block font-serif uppercase">Custo Unitário</span>
                      <span className="text-base font-mono font-semibold text-amber-300">
                        {formatCurrency(scannedProduct.costPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    <span>Localização: <strong className="text-slate-200">{scannedProduct.location.warehouse}</strong> - {scannedProduct.location.shelf} ({scannedProduct.location.level})</span>
                  </div>
                </div>

                {/* Direct Action Buttons for this Scanned Product */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    id="btn-quick-entry-from-scan"
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(scannedProduct, 'ENTRADA');
                      }
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Dar Entrada (+ Estoque)
                  </button>

                  <button
                    id="btn-quick-exit-from-scan"
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(scannedProduct, 'SAIDA');
                      }
                      onClose();
                    }}
                    className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Dar Saída (- Requisitar)
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={resetScan}
                    className="px-4 py-2 text-xs font-semibold text-amber-500 hover:text-amber-400 transition"
                  >
                    ← Bipar Outro Produto
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-[#252C36] transition"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
