import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Upload,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  Wrench,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/exportUtils';
import { BarcodeVisual } from './BarcodeVisual';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product, actionType?: 'ENTRADA' | 'SAIDA' | 'CAUTELA') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { products, getProductByBarcodeOrSku, playBeepSound } = useInventory();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedCodeRaw, setScannedCodeRaw] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [audioFeedback, setAudioFeedback] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'html5-qrcode-reader-container';

  const handleProductFound = useCallback((code: string) => {
    const clean = code.trim();
    setScannedCodeRaw(clean);
    const found = getProductByBarcodeOrSku(clean);

    if (found) {
      if (audioFeedback) {
        playBeepSound('success');
      }
      try {
        if ('vibrate' in navigator) navigator.vibrate(80);
      } catch {
        // ignore
      }

      setScannedProduct(found);
      setScanCount((prev) => prev + 1);

      if (!continuousMode) {
        setIsScanning(false);
      }
    } else {
      if (audioFeedback) {
        playBeepSound('warning');
      }
      setScannedProduct(null);
      setManualCode(clean);
    }
  }, [getProductByBarcodeOrSku, audioFeedback, continuousMode, playBeepSound]);

  // Start Camera with Html5Qrcode
  const startCameraScanner = useCallback(async () => {
    try {
      setCameraError(null);

      // Stop existing if any
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 20,
        qrbox: { width: 260, height: 160 },
        aspectRatio: 1.6,
      };

      await html5QrCode.start(
        { facingMode },
        qrConfig,
        (decodedText) => {
          handleProductFound(decodedText);
        },
        () => {
          // Frame without code, ignore silently
        }
      );

      setHasCameraPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      console.warn('HTML5 QR Code Camera Error:', err);
      setHasCameraPermission(false);
      setCameraError('Câmera indisponível ou permissão não concedida. Use a busca manual, leitura por imagem ou atalhos rápidos.');
    }
  }, [facingMode, handleProductFound]);

  const stopCameraScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
  }, []);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScannedProduct(null);
      setScannedCodeRaw(null);
      setManualCode('');
      setIsScanning(true);

      // Delay slightly for DOM element container render
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 150);

      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isOpen, facingMode, startCameraScanner, stopCameraScanner]);

  // Global Hardware USB/Bluetooth Barcode Scanner Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        barcodeBuffer = ''; // Reset buffer if typed too slowly (human typing)
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          handleProductFound(barcodeBuffer);
          barcodeBuffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleProductFound]);

  // Handle Image File Upload Barcode Recognition
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let qrCode = scannerRef.current;
      if (!qrCode) {
        qrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = qrCode;
      }

      const decodedText = await qrCode.scanFile(file, true);
      handleProductFound(decodedText);
    } catch (err) {
      playBeepSound('error');
      alert('Não foi possível identificar um código de barras legível nesta imagem.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProductFound(manualCode.trim());
  };

  const resetScan = () => {
    setScannedProduct(null);
    setScannedCodeRaw(null);
    setManualCode('');
    setIsScanning(true);
    if (scannerRef.current && !scannerRef.current.isScanning) {
      startCameraScanner();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-[#16191D] border border-slate-200 dark:border-[#2C333E] rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-[#262B33] bg-slate-50 dark:bg-[#121519] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-[#F9FAFB] flex items-center gap-2">
                  Leitor de Código de Barras & QR
                  {scanCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-bold">
                      {scanCount} lidos
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Bipagem ótica em tempo real (EAN-13, Code 128, QR Code)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`p-2 rounded-lg border transition ${
                  audioFeedback
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'text-slate-400 border-slate-200 dark:border-[#262B33]'
                }`}
                title={audioFeedback ? 'Beep Sonoro Ativo' : 'Beep Sonoro Mudo'}
              >
                {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                id="btn-close-scanner-modal"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20252D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 font-sans overflow-y-auto">
            {/* Viewfinder / Camera Screen */}
            <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#0B0D10] flex items-center justify-center border border-[#282E37] shadow-inner">
              {/* Html5Qrcode video mounting point */}
              <div
                id={scannerContainerId}
                className="w-full h-full object-cover flex items-center justify-center"
              />

              {/* Laser Animation Overlay */}
              {isScanning && hasCameraPermission && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="relative w-64 h-36 border-2 border-dashed border-amber-400/80 rounded-xl flex items-center justify-center bg-amber-500/5 shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />
                    <span className="text-[10px] text-amber-300 font-mono tracking-widest bg-[#14171A]/90 border border-amber-500/40 px-2.5 py-0.5 rounded uppercase font-bold">
                      CENTRALIZAR CÓDIGO
                    </span>
                  </div>
                </div>
              )}

              {/* Camera Error or Fallback */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0D0F12]/95 text-slate-300">
                  <Camera className="w-9 h-9 text-amber-500/60 mb-2" />
                  <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Carregar Foto / Imagem
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Quick Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-[#16191D]/90 text-slate-200 hover:text-white rounded-xl backdrop-blur border border-[#2D3540] text-xs flex items-center gap-1 hover:bg-[#232A34] transition"
                  title="Ler código a partir de imagem/foto"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  id="btn-toggle-camera-facing"
                  onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="p-2 bg-[#16191D]/90 text-white rounded-xl hover:bg-[#222831] backdrop-blur border border-[#2D3540] text-xs flex items-center gap-1 transition"
                  title="Alternar Câmera Frontal / Traseira"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Manual Code Entry Form */}
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-barcode-manual"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digitar código de barras, SKU ou ID do item..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2D3540] rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <button
                id="btn-submit-manual-barcode"
                type="submit"
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </form>

            {/* Product Identified Box */}
            {scannedProduct ? (
              <div className="p-4 bg-emerald-50/70 dark:bg-[#141B17] border border-emerald-300 dark:border-emerald-900/60 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-serif font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Produto Identificado no Almoxarifado
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border border-emerald-400/40 rounded-lg font-bold">
                    {scannedProduct.barcode}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 dark:text-[#F9FAFB] text-base sm:text-lg">
                      {scannedProduct.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                      SKU: <strong className="font-mono text-amber-600 dark:text-amber-400">{scannedProduct.sku}</strong> • Categoria: {scannedProduct.category}
                    </p>
                  </div>

                  {/* Real Barcode Graphic */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200 dark:border-[#2C333E] flex items-center justify-center shrink-0">
                    <BarcodeVisual value={scannedProduct.barcode} height={36} width={1.6} fontSize={11} />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2.5 bg-white dark:bg-[#1A221E] rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-serif uppercase">Estoque Atual</span>
                    <span className={`text-sm sm:text-base font-mono font-bold ${
                      scannedProduct.currentStock <= scannedProduct.minStock
                        ? 'text-red-500'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {scannedProduct.currentStock} {scannedProduct.unit}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#1A221E] rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-serif uppercase">Estoque Mínimo</span>
                    <span className="text-sm sm:text-base font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {scannedProduct.minStock} {scannedProduct.unit}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#1A221E] rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-serif uppercase">Custo Unitário</span>
                    <span className="text-sm sm:text-base font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(scannedProduct.costPrice)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Local: <strong>{scannedProduct.location.shelf} - {scannedProduct.location.level}</strong> ({scannedProduct.location.warehouse})</span>
                </div>

                {/* Quick One-Click Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    id="btn-quick-entry-from-scan"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(scannedProduct, 'ENTRADA');
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Dar Entrada (+)</span>
                  </button>

                  <button
                    id="btn-quick-exit-from-scan"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(scannedProduct, 'SAIDA');
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Dar Saída (-)</span>
                  </button>

                  <button
                    id="btn-quick-caution-from-scan"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(scannedProduct, 'CAUTELA');
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Emitir Cautela</span>
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <button
                    onClick={resetScan}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    ← Bipar Próximo Item
                  </button>
                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-slate-200 dark:bg-[#1C2128] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-[#252C36] transition"
                  >
                    Concluir Leitura
                  </button>
                </div>
              </div>
            ) : (
              scannedCodeRaw && (
                <div className="p-3.5 bg-amber-50 dark:bg-[#1E1C15] border border-amber-300 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">
                      Código "{scannedCodeRaw}" não cadastrado
                    </span>
                    <span className="text-amber-700 dark:text-amber-400/80 text-[11px]">
                      Deseja cadastrar um novo produto com este código?
                    </span>
                  </div>
                  <button
                    onClick={resetScan}
                    className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg"
                  >
                    Tentar Outro
                  </button>
                </div>
              )
            )}

            {/* Quick Testing Barcodes */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Bipagem de Teste Rápido do Almoxarifado:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProductFound(p.barcode)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-50 dark:bg-[#1C2128] dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2C333E] hover:border-amber-500/40 rounded-lg transition text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Barcode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{p.barcode}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">({p.sku})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
