import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertTriangle, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { handoverService } from '../../services/handover.service';

export const QRScanner = ({ bookingId, onSuccess, onClose }) => {
  const [useManual, setUseManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const elementId = `qr-reader-container-${bookingId}`;

  const processToken = async (scannedToken) => {
    const trimmed = scannedToken.trim();
    if (!trimmed.startsWith('SS-HO-')) {
      setErrorMessage('This is not a valid ShareSpare handover QR.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      await handoverService.verifyHandover({
        bookingId: Number(bookingId),
        handoverToken: trimmed,
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err) {
      console.error('Handover verification error:', err);
      const msg = err.response?.data?.message || 'Unable to verify this handover. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (useManual) {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isScanningRef.current = false;
          })
          .catch((err) => console.warn('Error stopping scanner:', err));
      }
      return;
    }

    let html5Qrcode;

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode(elementId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (isScanningRef.current) {
              isScanningRef.current = false;
              try {
                await html5Qrcode.stop();
              } catch (e) {
                console.warn('Camera stop error:', e);
              }
              await processToken(decodedText);
            }
          },
          () => {}
        );

        isScanningRef.current = true;
      } catch (err) {
        console.error('Scanner init/permission error:', err);
        const errStr = String(err);
        if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
          setErrorMessage('Camera permission was denied. Please allow camera access and try again.');
        } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFound')) {
          setErrorMessage('Camera is unavailable on this device.');
        } else {
          setErrorMessage('Unable to start QR scanner. Please try again.');
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isScanningRef.current = false;
          })
          .catch((e) => console.warn('Clean up error:', e));
      }
    };
  }, [useManual, bookingId]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken) return;
    processToken(manualToken);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Scan Handover QR</h3>
          <p className="text-xs text-slate-400">
            Point camera at lender's QR code or enter handover token manually
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start space-x-2 text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Handover Verified!</h4>
            <p className="text-xs text-slate-400">Booking status changed to ACTIVE.</p>
          </div>
        ) : isVerifying ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
            <p className="text-sm font-medium text-slate-300">Verifying Handover Token...</p>
          </div>
        ) : useManual ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Handover Token</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="SS-HO-xxxxxxxx-xxxx..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!manualToken.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-emerald-500/10"
            >
              Verify Token
            </button>

            <button
              type="button"
              onClick={() => setUseManual(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition"
            >
              Switch to Camera Scanner
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center">
              <div id={elementId} className="w-full h-full"></div>
            </div>

            <button
              type="button"
              onClick={() => setUseManual(true)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700/50"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Enter Token Manually</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
