import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, XCircle, Award, QrCode, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Certificate } from '../lib/types';
import { useParams } from '../lib/router';
import { getCertificateHtml } from '../lib/DocumentGenerator';

type VerifyState = 'idle' | 'loading' | 'valid' | 'revoked' | 'invalid';

function generateQRPattern(text: string): boolean[] {
  const cells = 21;
  const pattern = new Array(cells * cells).fill(false);
  const hash = cyrb53(text);
  for (let i = 0; i < cells * cells; i++) {
    const row = Math.floor(i / cells);
    const col = i % cells;
    if ((row < 8 && col < 8) || (row < 8 && col >= 13) || (row >= 13 && col < 8)) continue;
    pattern[i] = ((hash >> (i % 32)) & 1) === 1;
  }
  return pattern;
}

function cyrb53(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function QRCodeSvg({ text, size = 80 }: { text: string; size?: number }) {
  const cells = 21;
  const cellSize = Math.floor(size / cells);
  const actualSize = cellSize * cells;
  const pattern = generateQRPattern(text);
  const finder = (fx: number, fy: number) => {
    const s = cellSize;
    return (
      <g key={`${fx}-${fy}`}>
        <rect x={fx} y={fy} width={s * 7} height={s * 7} fill="#1a365d" opacity="0.1" />
        <rect x={fx + s} y={fy + s} width={s * 5} height={s * 5} fill="#fff" />
        <rect x={fx + s * 2} y={fy + s * 2} width={s * 3} height={s * 3} fill="#1a365d" />
      </g>
    );
  };
  const rects: JSX.Element[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (pattern[r * cells + c]) {
        rects.push(<rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a365d" />);
      }
    }
  }
  return (
    <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`}>
      {finder(0, 0)}
      {finder(actualSize - cellSize * 7, 0)}
      {finder(0, actualSize - cellSize * 7)}
      {rects}
    </svg>
  );
}



export default function VerifyCertificate() {
  const [certId, setCertId] = useState('');
  const [state, setState] = useState<VerifyState>('idle');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const qrScannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(880);

  const { certificateId } = useParams<{ certificateId?: string }>();

  const verifyCertificate = async (id: string) => {
    if (!id.trim()) return;
    setState('loading');
    setCert(null);

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', id.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      setState('invalid');
    } else if (data.is_revoked) {
      setCert(data as Certificate);
      setState('revoked');
    } else {
      setCert(data as Certificate);
      setState('valid');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(certId);
  };

  // Auto-verification from path params or URL query params
  useEffect(() => {
    if (certificateId) {
      setCertId(certificateId);
      verifyCertificate(certificateId);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get('id') || searchParams.get('cert_id');
      if (id) {
        setCertId(id);
        verifyCertificate(id);
      }
    }
  }, [certificateId, window.location.search, verifyCertificate]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setPreviewWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [cert]);

  const scaleFactor = previewWidth / 880;

  const startScanner = async () => {
    setIsScanning(true);
    setCert(null);
    setState('idle');

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode("reader");
        qrScannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            stopScanner();
            
            // Extract cert_id from URL if needed
            let parsedId = decodedText;
            if (decodedText.includes('?')) {
              try {
                const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                parsedId = urlParams.get('id') || urlParams.get('cert_id') || decodedText;
              } catch (e) {
                console.error("Error parsing QR URL parameters:", e);
              }
            }

            setCertId(parsedId);
            verifyCertificate(parsedId);
          },
          () => {
            // Parsing errors, ignore
          }
        );
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Unable to access camera. Please confirm permissions are active.");
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup scanner on page exit
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch((e: any) => console.error(e));
      }
    };
  }, []);

  return (
    <Layout>
      <style>{`
        .cert-preview-wrapper {
          max-width: 100%;
        }
      `}</style>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div data-aos="fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl mb-6">
              <Award size={32} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Certificate Verification</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Verify the authenticity of any TeKVora Infotech certificate instantly. No login required.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="card p-8" data-aos="fade-up">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Certificate ID</h2>
            <p className="text-gray-500 text-sm mb-6">
              The certificate ID is in the format <code className="bg-gray-100 px-2 py-0.5 rounded text-primary-600 font-mono text-xs">TI-YYYY-XXXX</code> (e.g., TI-2026-0001)
            </p>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-grow">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={certId}
                  onChange={e => setCertId(e.target.value)}
                  placeholder="e.g. TI-2026-0001"
                  className="input-field pl-11 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={isScanning ? stopScanner : startScanner}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
                >
                  <QrCode size={18} className="text-orange-400" />
                  {isScanning ? 'Stop Camera' : 'Scan QR'}
                </button>
                <button
                  type="submit"
                  disabled={state === 'loading' || !certId.trim()}
                  className="flex-grow sm:flex-grow-0 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {state === 'loading' ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Search size={16} />
                  )}
                  Verify
                </button>
              </div>
            </form>

            {/* QR Scanner Display */}
            {isScanning && (
              <div className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-lg relative">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  Camera Active - Align QR Code
                </h4>
                <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-800 shadow-inner bg-slate-950"></div>
                <style>{`
                  #reader video {
                    transform: scaleX(-1) !important;
                    -webkit-transform: scaleX(-1) !important;
                  }
                `}</style>
                <p className="text-[10px] text-slate-500 mt-2">Make sure permissions are granted and the environment is well-lit.</p>
              </div>
            )}

            {/* Results */}
            {state === 'valid' && cert && (
              <div className="border border-green-200 bg-green-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800 text-lg">Certificate Valid</h3>
                    <p className="text-green-600 text-sm">This certificate is authentic and verified.</p>
                  </div>
                </div>
                {/* Responsive Certificate Card */}
                <div ref={containerRef} className="relative w-full aspect-[880/620] overflow-hidden rounded-lg shadow-xl bg-white border border-slate-200">
                  <iframe
                    title="Certificate Preview"
                    srcDoc={getCertificateHtml(
                      cert,
                      `${window.location.origin}/verify/${cert.certificate_id}`,
                      '/logorbg.png',
                      '/signature.png'
                    )}
                    className="absolute top-0 left-0 border-0 origin-top-left"
                    style={{
                      width: '880px',
                      height: '620px',
                      transform: `scale(${scaleFactor})`,
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {state === 'revoked' && cert && (
              <div className="border border-red-200 bg-red-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                    <XCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 text-lg">Certificate Revoked</h3>
                    <p className="text-red-600 text-sm">This certificate has been revoked by the issuer.</p>
                  </div>
                </div>
                {cert.revocation_reason && (
                  <p className="bg-white rounded-xl p-4 text-sm text-gray-600">
                    <strong>Reason:</strong> {cert.revocation_reason}
                  </p>
                )}
              </div>
            )}

            {state === 'invalid' && (
              <div className="border border-orange-200 bg-orange-50 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-400 rounded-xl flex items-center justify-center">
                    <AlertCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-800 text-lg">Certificate Not Found</h3>
                    <p className="text-orange-600 text-sm">No certificate found with ID: <code className="font-mono">{certId}</code>. Please check and try again.</p>
                  </div>
                </div>
              </div>
            )}

            {state === 'idle' && (
              <div className="text-center py-8 text-gray-400">
                <Award size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Enter a certificate ID above to verify.</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 bg-white rounded-2xl p-5 text-center text-sm text-gray-500">
            <p>Certificates are issued exclusively by TeKVora Infotech administrators.</p>
            <p className="mt-1 text-gray-400 text-xs">Rate limited to 10 verifications per hour per IP for security.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
