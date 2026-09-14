import jsPDF from 'jspdf';
import { Certificate } from './types';

// Constants for assets
const LOGO_URL = '/logorbg.png';
const SIGNATURE_URL = '/signature.png';
const HR_SIGNATURE_URL = '/hr_signature.png';

async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to fetch image as base64:", imageUrl, error);
    return imageUrl;
  }
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

export function generateQRCodeSvg(text: string, size: number): string {
  const cells = 21;
  const cellSize = Math.floor(size / cells);
  const actualSize = cellSize * cells;
  const pattern = generateQRPattern(text);
  let rects = '';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (pattern[r * cells + c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0d1e3d"/>`;
      }
    }
  }
  const finder = (fx: number, fy: number) => {
    const s = cellSize;
    return `<rect x="${fx}" y="${fy}" width="${s*7}" height="${s*7}" fill="#0d1e3d" opacity="0.1"/><rect x="${fx+s}" y="${fy+s}" width="${s*5}" height="${s*5}" fill="#fff"/><rect x="${fx+s*2}" y="${fy+s*2}" width="${s*3}" height="${s*3}" fill="#0d1e3d"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}">${finder(0,0)}${finder(actualSize-cellSize*7,0)}${finder(0,actualSize-cellSize*7)}${rects}</svg>`;
}

export function getCertificateHtml(
  cert: Certificate,
  verificationUrl: string,
  logoBase64: string,
  signatureBase64: string,
  options: { forDownload?: boolean } = {}
) {
  const certIdLabel = cert.certificate_id;
  const issueDateStr = new Date(cert.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  const html = `
  <div class="cert-page-bg">
    <div class="cert-outer-border">
      <!-- Sophisticated Art Deco Border SVG -->
      <svg class="cert-border-svg" viewBox="0 0 840 590" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer thin gold border -->
        <rect x="3" y="3" width="834" height="584" fill="none" stroke="#c9a96e" stroke-width="1"/>

        <!-- Thick navy blue frame -->
        <rect x="8" y="8" width="824" height="574" fill="none" stroke="#0d1e3d" stroke-width="14"/>

        <!-- Inner gold line 1 -->
        <rect x="22" y="22" width="796" height="546" fill="none" stroke="#c9a96e" stroke-width="1.2"/>
        <!-- Inner gold line 2 (close) -->
        <rect x="27" y="27" width="786" height="536" fill="none" stroke="#c9a96e" stroke-width="0.6" opacity="0.7"/>

        <!-- TOP-LEFT Art Deco Corner -->
        <line x1="8" y1="60" x2="8" y2="8" stroke="#c9a96e" stroke-width="1"/>
        <line x1="8" y1="8" x2="60" y2="8" stroke="#c9a96e" stroke-width="1"/>
        <line x1="22" y1="55" x2="22" y2="22" stroke="#c9a96e" stroke-width="0.8"/>
        <line x1="22" y1="22" x2="55" y2="22" stroke="#c9a96e" stroke-width="0.8"/>
        <path d="M 8 8 L 30 8 L 8 30 Z" fill="#c9a96e" opacity="0.3"/>
        <path d="M 22 22 L 42 22 L 22 42 Z" fill="#c9a96e" opacity="0.5"/>

        <!-- TOP-RIGHT Art Deco Corner -->
        <line x1="832" y1="60" x2="832" y2="8" stroke="#c9a96e" stroke-width="1"/>
        <line x1="832" y1="8" x2="780" y2="8" stroke="#c9a96e" stroke-width="1"/>
        <line x1="818" y1="55" x2="818" y2="22" stroke="#c9a96e" stroke-width="0.8"/>
        <line x1="818" y1="22" x2="785" y2="22" stroke="#c9a96e" stroke-width="0.8"/>
        <path d="M 832 8 L 810 8 L 832 30 Z" fill="#c9a96e" opacity="0.3"/>
        <path d="M 818 22 L 798 22 L 818 42 Z" fill="#c9a96e" opacity="0.5"/>

        <!-- BOTTOM-LEFT Art Deco Corner -->
        <line x1="8" y1="530" x2="8" y2="582" stroke="#c9a96e" stroke-width="1"/>
        <line x1="8" y1="582" x2="60" y2="582" stroke="#c9a96e" stroke-width="1"/>
        <line x1="22" y1="535" x2="22" y2="568" stroke="#c9a96e" stroke-width="0.8"/>
        <line x1="22" y1="568" x2="55" y2="568" stroke="#c9a96e" stroke-width="0.8"/>
        <path d="M 8 582 L 30 582 L 8 560 Z" fill="#c9a96e" opacity="0.3"/>
        <path d="M 22 568 L 42 568 L 22 548 Z" fill="#c9a96e" opacity="0.5"/>

        <!-- BOTTOM-RIGHT Art Deco Corner -->
        <line x1="832" y1="530" x2="832" y2="582" stroke="#c9a96e" stroke-width="1"/>
        <line x1="832" y1="582" x2="780" y2="582" stroke="#c9a96e" stroke-width="1"/>
        <line x1="818" y1="535" x2="818" y2="568" stroke="#c9a96e" stroke-width="0.8"/>
        <line x1="818" y1="568" x2="785" y2="568" stroke="#c9a96e" stroke-width="0.8"/>
        <path d="M 832 582 L 810 582 L 832 560 Z" fill="#c9a96e" opacity="0.3"/>
        <path d="M 818 568 L 798 568 L 818 548 Z" fill="#c9a96e" opacity="0.5"/>

        <!-- Top center diamond -->
        <path d="M 420 3 L 426 9 L 420 15 L 414 9 Z" fill="#0d1e3d" stroke="#c9a96e" stroke-width="0.8"/>
        <!-- Bottom center diamond -->
        <path d="M 420 575 L 426 581 L 420 587 L 414 581 Z" fill="#0d1e3d" stroke="#c9a96e" stroke-width="0.8"/>
        <!-- Left center diamond -->
        <path d="M 3 295 L 9 301 L 15 295 L 9 289 Z" fill="#0d1e3d" stroke="#c9a96e" stroke-width="0.8"/>
        <!-- Right center diamond -->
        <path d="M 825 295 L 831 301 L 837 295 L 831 289 Z" fill="#0d1e3d" stroke="#c9a96e" stroke-width="0.8"/>

        <!-- Left mid Art Deco lines -->
        <line x1="8" y1="100" x2="8" y2="200" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="22" y1="100" x2="22" y2="200" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>
        <line x1="8" y1="390" x2="8" y2="490" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="22" y1="390" x2="22" y2="490" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>

        <!-- Right mid Art Deco lines -->
        <line x1="832" y1="100" x2="832" y2="200" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="818" y1="100" x2="818" y2="200" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>
        <line x1="832" y1="390" x2="832" y2="490" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="818" y1="390" x2="818" y2="490" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>

        <!-- Top mid Art Deco lines -->
        <line x1="100" y1="8" x2="200" y2="8" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="640" y1="8" x2="740" y2="8" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="100" y1="22" x2="200" y2="22" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>
        <line x1="640" y1="22" x2="740" y2="22" stroke="#c9a96e" stroke-width="0.4" opacity="0.4"/>
        <line x1="100" y1="574" x2="200" y2="574" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
        <line x1="640" y1="574" x2="740" y2="574" stroke="#c9a96e" stroke-width="0.7" opacity="0.5"/>
      </svg>

      <div class="cert-inner-border">
        <!-- Technology Circuit Watermark -->
        <svg class="cert-grid-bg" viewBox="0 0 840 590" xmlns="http://www.w3.org/2000/svg">
          <path d="M 40 295 L 140 295 L 160 315 L 260 315 L 280 295 L 340 295" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <path d="M 70 220 L 130 220 L 150 240 L 240 240 L 260 220 L 320 220" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <path d="M 60 370 L 120 370 L 140 350 L 230 350 L 250 370 L 310 370" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <path d="M 800 295 L 700 295 L 680 275 L 580 275 L 560 295 L 500 295" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <path d="M 780 220 L 700 220 L 680 240 L 590 240 L 570 220 L 520 220" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <path d="M 790 370 L 720 370 L 700 390 L 610 390 L 590 370 L 530 370" fill="none" stroke="#0d1e3d" stroke-width="0.9" opacity="0.1"/>
          <circle cx="150" cy="295" r="2" fill="#38bdf8" opacity="0.3"/>
          <circle cx="260" cy="315" r="2" fill="#38bdf8" opacity="0.3"/>
          <circle cx="240" cy="240" r="2" fill="#38bdf8" opacity="0.3"/>
          <circle cx="700" cy="295" r="2" fill="#38bdf8" opacity="0.3"/>
          <circle cx="580" cy="275" r="2" fill="#38bdf8" opacity="0.3"/>
          <circle cx="700" cy="220" r="2" fill="#38bdf8" opacity="0.3"/>
        </svg>
        <img src="${logoBase64}" class="cert-watermark-logo" alt="watermark" />

        <div class="cert-header">
          <div class="logo-container">
            <img src="${logoBase64}" class="logo-img" alt="Logo" />
            <div class="logo-text-block">
              <h1 class="brand-name">TEKVORA INFOTECH</h1>
              <p class="brand-slogan">EMPOWERING FUTURE LEADERS</p>
            </div>
          </div>
        </div>

        <div class="cert-title-section">
          <h1 class="main-title">CERTIFICATE</h1>
          <h2 class="sub-title">OF EXCELLENCE</h2>
          <div class="ornament-line">
            <div class="line-segment"></div>
            <div class="diamond-small"></div>
            <div class="line-segment wide"></div>
            <div class="diamond-small"></div>
            <div class="line-segment"></div>
          </div>
        </div>

        <p class="presented-to">This is proudly presented to</p>
        <h2 class="recipient-name">${cert.holder_name.toUpperCase()}</h2>
        
        <!-- Gold ornament recipient divider line -->
        <div class="recipient-divider">
          <div class="recipient-divider-line left"></div>
          <div class="recipient-divider-diamond"></div>
          <div class="recipient-divider-line right"></div>
        </div>
        
        <p class="completion-text">for successfully completing the specialized program in</p>
        <h3 class="program-name">${cert.program_name.toUpperCase()}</h3>

        <div class="meta-row">
          <span class="meta-item">Duration: <strong>${cert.duration || 'Specialized'}</strong></span>
          <span class="meta-divider">|</span>
          <span class="meta-item">Issue Date: <strong>${issueDateStr}</strong></span>
        </div>
        <div class="cert-id-row">
          Certificate ID: <span class="cert-id-val">${certIdLabel}</span>
        </div>

        <div class="cert-footer">
          <div class="footer-left">
            <!-- Square wavy scalloped gold badge -->
            <div class="gold-seal-container">
              <svg class="gold-seal-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#b8860b" />
                    <stop offset="25%" stop-color="#e6ca65" />
                    <stop offset="50%" stop-color="#996515" />
                    <stop offset="75%" stop-color="#ffd700" />
                    <stop offset="100%" stop-color="#b8860b" />
                  </linearGradient>
                </defs>
                <path d="M 15 15 Q 20 10 25 15 Q 30 10 35 15 Q 40 10 45 15 Q 50 10 55 15 Q 60 10 65 15 Q 70 10 75 15 Q 80 10 85 15 Q 90 10 95 15 Q 100 10 105 15
                         Q 110 20 105 25 Q 110 30 105 35 Q 110 40 105 45 Q 110 50 105 55 Q 110 60 105 65 Q 110 70 105 75 Q 110 80 105 85 Q 110 90 105 95 Q 110 100 105 105
                         Q 100 110 95 105 Q 90 110 85 105 Q 80 110 75 105 Q 70 110 65 105 Q 60 110 55 105 Q 50 110 45 105 Q 40 110 35 105 Q 30 110 25 105 Q 20 110 15 105
                         Q 10 100 15 95 Q 10 90 15 85 Q 10 80 15 75 Q 10 70 15 65 Q 10 60 15 55 Q 10 50 15 45 Q 10 40 15 35 Q 10 30 15 25 Q 10 20 15 15 Z" 
                      fill="url(#goldGrad2)" stroke="#8b7340" stroke-width="0.5" />
                <rect x="23" y="23" width="74" height="74" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2.5,1.5" opacity="0.8"/>
                
                <!-- TV Logo inside badge -->
                <g transform="translate(60, 42) scale(0.25)" opacity="0.95">
                  <path d="M -30 -15 L 0 -15 M -15 -15 L -15 20" fill="none" stroke="#4a3b1a" stroke-width="8" stroke-linecap="round"/>
                  <path d="M -15 20 L 10 -25 L 35 10" fill="none" stroke="#8b7340" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="10" cy="-25" r="4" fill="#8b7340"/>
                  <circle cx="35" cy="10" r="4" fill="#8b7340"/>
                </g>

                <text x="60" y="76" font-family="'Inter', sans-serif" font-size="7" font-weight="900" fill="#4a3b1a" text-anchor="middle" letter-spacing="0.2">TEKVORA</text>
                <text x="60" y="85" font-family="'Inter', sans-serif" font-size="7" font-weight="900" fill="#4a3b1a" text-anchor="middle" letter-spacing="0.2">CERTIFIED</text>
                <text x="60" y="93" font-family="'Inter', sans-serif" font-size="3.5" font-weight="700" fill="#4a3b1a" text-anchor="middle" letter-spacing="0.2">COMPLETION - EXCELLENCE</text>
              </svg>
            </div>

            <div class="qr-verify-block">
              <span class="scan-label">SCAN TO VERIFY</span>
              <div class="qr-container-rel">
                <span class="checkmark-icon">✓</span>
                <img src="${qrCodeBase64}" crossOrigin="anonymous" class="qr-img" alt="Verification QR" />
              </div>
            </div>
          </div>

          <div class="footer-right">
            <img src="${signatureBase64}" class="sig-img" alt="Authorized Signatory" />
          </div>
        </div>
    </div>
  </div>`;

  const styles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=Great+Vibes&family=Dancing+Script&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', sans-serif; background: #3a4d6b; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:30px; }
    
    .cert-page-bg {
      padding: 18px;
      background: #3a4d6b;
      border-radius: 6px;
      display: inline-block;
    }

    .cert-outer-border {
      width: 840px;
      height: 590px;
      position: relative;
      background: linear-gradient(160deg, #fafaf7 0%, #ffffff 55%, #f6f4ef 100%);
      box-shadow: 0 25px 70px rgba(0,0,0,0.5);
      overflow: hidden;
      padding: 36px 46px 26px 46px;
    }
    
    .cert-border-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      pointer-events: none;
    }

    .cert-inner-border {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 2;
    }

    .cert-watermark-logo {
      position: absolute;
      top: 6%;
      right: 3%;
      width: 220px;
      height: auto;
      opacity: 0.055;
      pointer-events: none;
      z-index: 0;
      user-select: none;
      filter: grayscale(100%);
    }
    
    .cert-grid-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .cert-header {
      display: flex;
      justify-content: center;
      margin-bottom: 2px;
      position: relative;
      z-index: 10;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-img {
      width: 54px;
      height: 54px;
      object-fit: contain;
    }
    .logo-text-block {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 800;
      color: #0d1e3d;
      letter-spacing: 1px;
      line-height: 1.1;
    }
    .brand-slogan {
      font-family: 'Inter', sans-serif;
      font-size: 7.5px;
      font-weight: 700;
      color: #c9a96e;
      letter-spacing: 2.5px;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .cert-title-section {
      text-align: center;
      margin-bottom: 2px;
      position: relative;
      z-index: 10;
    }
    .main-title {
      font-family: 'Cinzel', serif;
      font-size: 42px;
      font-weight: 800;
      color: #0d1e3d;
      letter-spacing: 8px;
      line-height: 1.0;
    }
    .sub-title {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 700;
      color: #c9a96e;
      letter-spacing: 5px;
      margin-top: 1px;
    }
    .ornament-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 5px;
    }
    .line-segment {
      height: 1px;
      width: 40px;
      background: #c9a96e;
      opacity: 0.8;
    }
    .line-segment.wide {
      width: 20px;
    }
    .diamond-small {
      width: 5px;
      height: 5px;
      background-color: #c9a96e;
      transform: rotate(45deg);
      flex-shrink: 0;
    }
    .presented-to {
      text-align: center;
      font-size: 12px;
      color: #5a6a8a;
      font-style: normal;
      font-weight: 400;
      margin-bottom: 0px;
      letter-spacing: 0.3px;
      position: relative;
      z-index: 10;
    }
    .recipient-name {
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: 34px;
      color: #0d1e3d;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 1px;
      position: relative;
      z-index: 10;
    }
    
    .recipient-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 3px 0 2px;
      position: relative;
      z-index: 10;
    }
    .recipient-divider-line {
      width: 180px;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, #c9a96e 40%, #c9a96e 60%, transparent);
      position: relative;
    }
    .recipient-divider-diamond {
      width: 8px;
      height: 8px;
      border: 1.5px solid #c9a96e;
      transform: rotate(45deg);
      position: relative;
      flex-shrink: 0;
    }
    .recipient-divider-diamond::after {
      content: '';
      position: absolute;
      width: 3px;
      height: 3px;
      background-color: #c9a96e;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .completion-text {
      text-align: center;
      font-size: 11.5px;
      color: #5a6a8a;
      margin-bottom: 0px;
      position: relative;
      z-index: 10;
      font-weight: 400;
    }
    .program-name {
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: 16px;
      color: #0d1e3d;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      position: relative;
      z-index: 10;
    }
    .meta-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      font-size: 11px;
      color: #475569;
      margin-bottom: 1px;
      position: relative;
      z-index: 10;
    }
    .meta-divider {
      color: #c9a96e;
      font-size: 14px;
    }
    .cert-id-row {
      text-align: center;
      font-size: 10px;
      color: #64748b;
      margin-bottom: 5px;
      position: relative;
      z-index: 10;
    }
    .cert-id-val {
      font-family: monospace;
      font-weight: 700;
      color: #0d1e3d;
    }
    
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 10;
    }
    .footer-left {
      display: flex;
      align-items: flex-end;
      gap: 16px;
    }
    .gold-seal-container {
      filter: drop-shadow(0 4px 8px rgba(184, 134, 11, 0.4));
    }
    .gold-seal-svg {
      width: 90px;
      height: 90px;
    }
    .qr-verify-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .qr-container-rel {
      position: relative;
      display: inline-block;
    }
    .scan-label {
      font-size: 7px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .checkmark-icon {
      font-size: 6px;
      color: #ffffff;
      background-color: #0d1e3d;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      font-weight: bold;
      position: absolute;
      right: -4px;
      top: -4px;
      border: 1.2px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      z-index: 10;
    }
    .qr-img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border: 1.5px solid #c9a96e;
      padding: 2px;
      background: #fff;
    }
    .footer-right {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      width: 190px;
    }
    .sig-img {
      width: 175px;
      height: auto;
      object-fit: contain;
      display: block;
      margin-bottom: 2px;
    }


    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }
      html {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #3a4d6b !important;
        width: 297mm !important;
        height: 210mm !important;
        overflow: hidden !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .cert-page-bg {
        margin: 0 !important;
        padding: 0 !important;
        background: #3a4d6b !important;
        border-radius: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 297mm !important;
        height: 210mm !important;
        box-sizing: border-box !important;
        /* Scale the fixed-pixel cert to fill A4 landscape */
        /* A4 landscape = 297mm x 210mm = ~1123px x ~794px at 96dpi */
        /* cert is 840x590px + 36px padding = 876px wide, 626px tall */
        /* Scale factor: min(1123/876, 794/626) = min(1.28, 1.27) = 1.27 */
        /* Use slightly less to add margins */
      }
      .cert-page-bg > * {
        transform: scale(0.95) !important;
        transform-origin: center center !important;
      }
      .cert-outer-border {
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
  `;

  if (options.forDownload) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="880" height="640">
      <rect width="100%" height="100%" fill="#3a4d6b"/>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${styles}
          ${html}
        </div>
      </foreignObject>
    </svg>`;
  }

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Certificate - ${cert.certificate_id}</title>
      ${styles}
    </head>
    <body>
      ${html}
      <script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
    </body>
  </html>`;
}

async function generateCertificateCanvas(cert: Certificate): Promise<HTMLCanvasElement | null> {
  const verificationUrl = `${window.location.origin}/verify/${cert.certificate_id}`;
  const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
  const signatureBase64 = await getBase64ImageFromUrl(SIGNATURE_URL);
  
  // Create a temporary container for rendering the HTML in DOM
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '900px';
  tempDiv.style.height = '650px';
  tempDiv.style.background = '#3a4d6b';
  
  const htmlContent = getCertificateHtml(cert, verificationUrl, logoBase64, signatureBase64, { forDownload: false });
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  // Wait a small timeout for images/resources to resolve
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  try {
    const targetElement = tempDiv.querySelector('.cert-page-bg') as HTMLElement;
    if (!targetElement) {
      document.body.removeChild(tempDiv);
      return null;
    }
    
    const canvas = await html2canvas(targetElement, {
      scale: 2, // 2x scale for 300 DPI high resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#3a4d6b',
      logging: false
    });
    
    document.body.removeChild(tempDiv);
    return canvas;
  } catch (error) {
    console.error("html2canvas generation failed:", error);
    document.body.removeChild(tempDiv);
    return null;
  }
}

export async function downloadCertificatePDF(cert: Certificate) {
  const canvas = await generateCertificateCanvas(cert);
  if (!canvas) return;
  
  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  
  doc.addImage(imgData, 'PNG', 0, 0, width, height);
  doc.save(`TeKVora_Certificate_${cert.certificate_id}.pdf`);
}

export async function downloadCertificatePNG(cert: Certificate) {
  const canvas = await generateCertificateCanvas(cert);
  if (!canvas) return;
  
  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `TeKVora_Certificate_${cert.certificate_id}.png`;
  a.click();
}

export async function printCertificate(cert: Certificate) {
  const verificationUrl = `${window.location.origin}/verify/${cert.certificate_id}`;
  const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
  const signatureBase64 = await getBase64ImageFromUrl(SIGNATURE_URL);
  const html = getCertificateHtml(cert, verificationUrl, logoBase64, signatureBase64);
  
  const w = window.open('', '_blank', 'width=1024,height=800');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export async function generateCertificatePDFOriginal(cert: Certificate, qrCodeDataUrl?: string) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  try {
    const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
    const signatureBase64 = await getBase64ImageFromUrl(SIGNATURE_URL);

    // Add Watermark (centered, large, transparent)
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 }));
    doc.addImage(logoBase64, 'PNG', width / 2 - 50, height / 2 - 50, 100, 100);
    (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 }));

    // Border
    doc.setDrawColor(13, 30, 61); // Navy
    doc.setLineWidth(5);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(201, 169, 110); // Gold
    doc.setLineWidth(1);
    doc.rect(12, 12, width - 24, height - 24);

    // Logo
    doc.addImage(logoBase64, 'PNG', width / 2 - 25, 20, 15, 15);

    // Brand Name
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(13, 30, 61);
    doc.text('TEKVORA INFOTECH', width / 2, 42, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(201, 169, 110);
    doc.text('EMPOWERING FUTURE LEADERS', width / 2, 46, { align: 'center' });

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(13, 30, 61);
    doc.text('CERTIFICATE', width / 2, 62, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(201, 169, 110);
    doc.text('OF EXCELLENCE', width / 2, 68, { align: 'center' });

    // Ribbon divider line
    doc.setDrawColor(201, 169, 110);
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 30, 72, width / 2 + 30, 72);

    // Presented to text
    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('This is proudly presented to', width / 2, 85, { align: 'center' });

    // Name
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(13, 30, 61);
    doc.text(cert.holder_name.toUpperCase(), width / 2, 98, { align: 'center' });

    // Completed specialized program
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('for successfully completing the specialized program in', width / 2, 110, { align: 'center' });

    // Program name
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(13, 30, 61);
    doc.text(cert.program_name.toUpperCase(), width / 2, 122, { align: 'center' });

    // Metadata Row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const dateStr = new Date(cert.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Duration: ${cert.duration || 'Specialized'}   |   Issue Date: ${dateStr}`, width / 2, 134, { align: 'center' });

    // ID
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Certificate ID: ${cert.certificate_id}`, width / 2, 144, { align: 'center' });

    // Signature
    doc.addImage(signatureBase64, 'PNG', width - 75, 150, 45, 12);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(width - 80, 163, width - 30, 163);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 30, 61);
    doc.text('Kamlesh Raut', width - 55, 168, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('HR, TeKVora Infotech', width - 55, 172, { align: 'center' });

    // QR Code
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', 35, 150, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('SCAN TO VERIFY', 45, 173, { align: 'center' });
    }

    doc.save(`TeKVora_Certificate_${cert.certificate_id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

async function generateDocCanvas(htmlContent: string): Promise<HTMLCanvasElement | null> {
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  try {
    const targetElement = tempDiv.querySelector('.doc-outer-border') as HTMLElement;
    // Wait for fonts and images to resolve
    await new Promise(resolve => setTimeout(resolve, 800));
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    return canvas;
  } catch (error) {
    console.error("Document canvas generation failed:", error);
    return null;
  } finally {
    tempDiv.remove();
  }
}function getOfferLetterHtml(intern: any, logoBase64: string, signatureBase64: string): string {
  const numberPart = intern.intern_id ? intern.intern_id.replace(/\D/g, '') : Math.floor(10000 + Math.random() * 90000);
  const refNo = `TVR/OL/2026/TVR-INT-${numberPart}`;
  
  const start = intern.start_date ? new Date(intern.start_date) : new Date();
  const end = intern.end_date ? new Date(intern.end_date) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  const dateStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const startStr = start.toLocaleDateString('en-IN');
  const endStr = end.toLocaleDateString('en-IN');

  const commonStyles = `
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Inter', sans-serif; background: #f8fafc; }
      .page.doc-outer-border {
        width: 800px;
        background: #ffffff;
        padding: 40px 50px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        position: relative;
        height: 1080px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin: 0 auto 30px auto;
      }
      .header-banner {
        background-color: #0c2340;
        color: #ffffff;
        padding: 20px 30px;
        margin: -40px -50px 20px -50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-left { display: flex; align-items: center; gap: 12px; }
      .header-logo { width: 44px; height: 44px; object-fit: contain; background: #ffffff; padding: 4px; border-radius: 6px; }
      .header-company { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
      .header-iso { font-size: 7px; color: #94a3b8; letter-spacing: 1.5px; font-weight: 600; margin-top: 2px; text-transform: uppercase; }
      .header-right { text-align: right; font-size: 9px; color: #cbd5e1; line-height: 1.4; }
      .title-section { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; }
      .title-text { font-family: 'Playfair Display', serif; font-size: 22px; color: #0c2340; font-weight: 700; }
      .ref-text { font-size: 10px; color: #64748b; font-family: monospace; }
      .date-section { text-align: right; font-size: 11px; color: #475569; margin-bottom: 15px; }
      .to-section { margin-bottom: 15px; }
      .to-label { font-size: 9px; font-weight: 700; color: #1e3a8a; letter-spacing: 1.5px; margin-bottom: 3px; }
      .to-name { font-size: 15px; font-weight: 700; color: #0c2340; }
      .to-details { font-size: 10.5px; color: #64748b; margin-top: 1px; }
      .salutation { font-size: 12.5px; font-weight: 600; color: #0c2340; margin-bottom: 10px; }
      .body-text { font-size: 12px; line-height: 1.55; color: #475569; margin-bottom: 12px; }
      .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1e3a8a; border-radius: 8px; padding: 12px 18px; margin-bottom: 15px; }
      .details-grid { display: grid; grid-template-columns: 160px 1fr; row-gap: 6px; font-size: 11.5px; }
      .grid-label { color: #64748b; }
      .grid-value { font-weight: 600; color: #0c2340; }
      .terms-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 18px; margin-bottom: 15px; }
      .terms-title { font-size: 11.5px; font-weight: 700; color: #d97706; margin-bottom: 4px; }
      .terms-list { font-size: 10.5px; color: #78350f; list-style: none; display: flex; flex-direction: column; gap: 3px; }
      .footer-sig-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 15px; }
      .sig-block { width: 200px; text-align: left; }
      .sig-label { font-size: 11px; color: #64748b; margin-bottom: 30px; }
      .sig-line { height: 1px; background-color: #cbd5e1; margin: 4px 0; }
      .sig-name { font-size: 11px; font-weight: 700; color: #0c2340; }
      .sig-name-cursive { font-family: 'Dancing Script', cursive; font-size: 20px; color: #0c2340; font-weight: 600; line-height: 1; margin-bottom: 2px; }
      .sig-title { font-size: 8.5px; color: #64748b; }
      .footer-banner { background-color: #0c2340; color: #ffffff; padding: 10px 30px; margin: 25px -50px -40px -50px; display: flex; justify-content: space-between; font-size: 8px; color: #cbd5e1; }
      @media print { 
        body { background-color: #ffffff; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
        .page.doc-outer-border { box-shadow: none; width: 210mm !important; height: 297mm !important; padding: 40px 50px !important; margin: 0 !important; page-break-after: always !important; break-after: page !important; overflow: hidden !important; } 
        .page.doc-outer-border.page-two { page-break-before: always !important; break-before: page !important; page-break-after: avoid !important; break-after: avoid !important; }
      }
    </style>
  `;

  return `
    ${commonStyles}
    <div class="page doc-outer-border">
      <div>
        <div class="header-banner">
          <div class="header-left">
            <img src="${logoBase64}" class="header-logo" alt="Logo" />
            <div>
              <div class="header-company">TeKVora Infotech</div>
              <div class="header-iso">ISO 9001:2015 CERTIFIED</div>
            </div>
          </div>
          <div class="header-right">
            Chhatrapati Sambhajinagar, Maharashtra 431001, India<br/>
            info@tekvora.in · www.tekvora.in
          </div>
        </div>

        <div class="title-section">
          <div class="title-text">Internship Offer Letter</div>
          <div class="ref-text">Ref: ${refNo}</div>
        </div>

        <div class="date-section">Date: ${dateStr}</div>

        <div class="to-section">
          <div class="to-label">TO</div>
          <div class="to-name">${intern.full_name}</div>
          <div class="to-details">${intern.email} ${intern.phone ? `· ${intern.phone}` : ''}</div>
        </div>

        <div class="salutation">Dear ${intern.full_name},</div>

        <p class="body-text">
          We are pleased to offer you an internship position at <strong>TeKVora Infotech</strong>. After reviewing your application and qualifications, we are delighted to extend this offer for the role mentioned below.
        </p>

        <div class="details-box">
          <div class="details-grid">
            <div class="grid-label">Intern Name</div>
            <div class="grid-value">${intern.full_name}</div>
            
            <div class="grid-label">Intern ID</div>
            <div class="grid-value">${intern.intern_id}</div>
            
            <div class="grid-label">Role / Position</div>
            <div class="grid-value">${intern.internship_title || 'Software Development Intern'}</div>
            
            <div class="grid-label">Internship Mode</div>
            <div class="grid-value">Remote / Online</div>
            
            <div class="grid-label">Duration</div>
            <div class="grid-value">3 Months</div>
            
            <div class="grid-label">Start Date</div>
            <div class="grid-value">${startStr}</div>
            
            <div class="grid-label">End Date</div>
            <div class="grid-value">${endStr}</div>
            
            <div class="grid-label">Stipend</div>
            <div class="grid-value">Unpaid / Certificate-Based</div>
          </div>
        </div>

        <p class="body-text">
          During this internship, you will work on live projects and gain hands-on experience under the mentorship of our senior team. You are expected to maintain professional conduct, meet deadlines, and actively contribute to assigned tasks.
        </p>

        <div class="terms-box">
          <div class="terms-title">Terms & Conditions:</div>
          <ul class="terms-list">
            <li>1. This offer is subject to submission of required documents (Aadhar card, college ID, recent photograph).</li>
            <li>2. All work produced remains the intellectual property of TeKVora Infotech.</li>
            <li>3. Upon successful completion, a Certificate of Internship and Letter of Recommendation will be issued.</li>
            <li>4. Please confirm acceptance within 3 working days by replying to info@tekvora.in.</li>
          </ul>
        </div>

        <p class="body-text">
          We look forward to welcoming you aboard and are confident this experience will be enriching for your professional growth.
        </p>
      </div>

      <div>
        <div class="footer-sig-section">
          <div class="sig-block">
            <div class="sig-label">Accepted by (Intern):</div>
            <div class="sig-line"></div>
            <div class="sig-name">${intern.full_name}</div>
            <div style="font-size: 8px; color: #94a3b8; margin-top: 15px;">Signature & Date</div>
          </div>

          <div class="sig-block" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; position: relative; padding-right: 35px;">
            <!-- Seal badge overlay -->
            <div style="position: absolute; right: -15px; top: -50px; border: 1.5px solid #b8860b; border-radius: 50%; width: 62px; height: 62px; display: flex; flex-direction: column; justify-content: center; align-items: center; transform: rotate(15deg); opacity: 0.85; background: #fffdf5; box-shadow: 0 4px 8px rgba(184,134,11,0.08);">
              <span style="font-size: 5.5px; font-weight: 800; color: #b8860b; letter-spacing: 0.5px; line-height: 1.1;">TEKVORA</span>
              <span style="font-size: 6px; font-weight: 900; color: #0d1e3d; border-top: 0.5px solid #b8860b; border-bottom: 0.5px solid #b8860b; padding: 0.5px 0; margin: 0.5px 0; letter-spacing: 0.5px;">INFOTECH</span>
              <span style="font-size: 4.5px; font-weight: 800; color: #b8860b; letter-spacing: 0.5px;">OFFICIAL SEAL</span>
            </div>
            <!-- Kamlesh Raut Signature -->
            <img src="${signatureBase64}" style="max-height: 42px; max-width: 140px; margin-bottom: 4px; object-fit: contain;" />
            <div style="font-size: 12px; font-weight: 700; color: #0d1e3d;">Kamlesh Raut</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">HR</div>
            <div style="font-size: 8.5px; color: #94a3b8;">TekVora Infotech</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 2 -->
    <div class="page doc-outer-border page-two">
      <div style="flex-grow: 1;"></div>
      <div class="footer-banner">
        <div>TeKVora Infotech | U62099MH2024PTC XXXXXX</div>
        <div>www.tekvora.in | ISO 9001:2015 Certified</div>
      </div>
    </div>
  `;
}

function getLORHtml(intern: any, logoBase64: string, signatureBase64: string, customRating?: string, customAchievements?: string): string {
  const numberPart = intern.intern_id ? intern.intern_id.replace(/\D/g, '') : Math.floor(10000 + Math.random() * 90000);
  const refNo = `TVR/LOR/2026/TVR-INT-${numberPart}`;
  
  const start = intern.start_date ? new Date(intern.start_date) : new Date();
  const end = intern.end_date ? new Date(intern.end_date) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  const dateStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const startStr = start.toLocaleDateString('en-IN');
  const endStr = end.toLocaleDateString('en-IN');
  
  const rating = customRating || 'Excellent';
  const achievementsText = customAchievements || '';

  return `
    <div class="page doc-outer-border">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; }
        .page.doc-outer-border {
          width: 800px;
          background: #ffffff;
          padding: 40px 50px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          position: relative;
          height: 1080px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin: 0 auto 30px auto;
        }
        .header-banner {
          background-color: #0c2340;
          color: #ffffff;
          padding: 20px 30px;
          margin: -40px -50px 20px -50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-logo { width: 44px; height: 44px; object-fit: contain; background: #ffffff; padding: 4px; border-radius: 6px; }
        .header-company { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
        .header-iso { font-size: 7px; color: #94a3b8; letter-spacing: 1.5px; font-weight: 600; margin-top: 2px; text-transform: uppercase; }
        .header-right { text-align: right; font-size: 9px; color: #cbd5e1; line-height: 1.4; }
        .title-section { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; }
        .title-text { font-family: 'Playfair Display', serif; font-size: 22px; color: #0c2340; font-weight: 700; }
        .ref-text { font-size: 10px; color: #64748b; font-family: monospace; }
        .date-section { text-align: right; font-size: 11px; color: #475569; margin-bottom: 15px; }
        .to-whom { font-size: 13px; font-weight: 700; color: #0c2340; margin-bottom: 10px; }
        .body-text { font-size: 12px; line-height: 1.55; color: #475569; margin-bottom: 12px; text-align: justify; }
        .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1e3a8a; border-radius: 8px; padding: 12px 18px; margin-bottom: 15px; }
        .details-grid { display: grid; grid-template-columns: 160px 1fr; row-gap: 6px; font-size: 11.5px; }
        .grid-label { color: #64748b; }
        .grid-value { font-weight: 600; color: #0c2340; }
        .footer-sig-section { display: flex; justify-content: flex-end; margin-top: auto; padding-top: 15px; }
        .sig-block { width: 220px; text-align: left; }
        .footer-banner { background-color: #0c2340; color: #ffffff; padding: 10px 30px; margin: 25px -50px -45px -50px; display: flex; justify-content: space-between; font-size: 8px; color: #cbd5e1; }
        @media print { 
          body { background-color: #ffffff; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
          .page.doc-outer-border { box-shadow: none; width: 210mm !important; height: 297mm !important; padding: 40px 50px !important; margin: 0 !important; page-break-after: always !important; break-after: page !important; overflow: hidden !important; } 
          .page.doc-outer-border.page-two { page-break-before: always !important; break-before: page !important; page-break-after: avoid !important; break-after: avoid !important; }
        }
      </style>
      <div>
        <div class="header-banner">
          <div class="header-left">
            <img src="${logoBase64}" class="header-logo" alt="Logo" />
            <div>
              <div class="header-company">TeKVora Infotech</div>
              <div class="header-iso">ISO 9001:2015 CERTIFIED</div>
            </div>
          </div>
          <div class="header-right">
            Chhatrapati Sambhajinagar, Maharashtra 431001, India<br/>
            info@tekvora.in · www.tekvora.in
          </div>
        </div>

        <div class="title-section">
          <div class="title-text">Letter of Recommendation</div>
          <div class="ref-text">Ref: ${refNo}</div>
        </div>

        <div class="date-section">Date: ${dateStr}</div>

        <div class="to-whom">To Whomsoever It May Concern,</div>

        <p class="body-text">
          It is with great pleasure that I write this Letter of Recommendation for <strong>${intern.full_name}</strong>, who has successfully completed an internship at <strong>TeKVora Infotech</strong>.
        </p>

        <div class="details-box">
          <div class="details-grid">
            <div class="grid-label">Name</div>
            <div class="grid-value">${intern.full_name}</div>
            
            <div class="grid-label">Intern ID</div>
            <div class="grid-value">${intern.intern_id}</div>
            
            <div class="grid-label">Role</div>
            <div class="grid-value">${intern.internship_title || 'Software Developer Intern'}</div>
            
            <div class="grid-label">Duration</div>
            <div class="grid-value">3 Months</div>
            
            <div class="grid-label">Period</div>
            <div class="grid-value">${startStr} to ${endStr}</div>
            
            <div class="grid-label">Overall Performance</div>
            <div class="grid-value" style="color: #10b981;">${rating}</div>
          </div>
        </div>

        <p class="body-text">
          During the internship tenure, <strong>${intern.full_name}</strong> demonstrated exceptional dedication, a strong work ethic, and a remarkable ability to adapt to real-world software development challenges. <strong>${intern.full_name}</strong> consistently delivered high-quality work and showed commendable initiative.
        </p>

        <p class="body-text">
          ${achievementsText || `<strong>${intern.full_name}</strong> displayed excellent proficiency in software development, problem-solving, and professional communication. Their contributions to our live projects were noteworthy and they proved to be a valuable member of the development team.`}
        </p>

        <p class="body-text">
          Their ability to collaborate effectively with teammates, communicate ideas clearly, and maintain a professional attitude throughout the internship was truly commendable. We are confident that <strong>${intern.full_name}</strong> will be a great asset to any organization.
        </p>

        <p class="body-text">
          We wholeheartedly recommend <strong>${intern.full_name}</strong> for any professional opportunity. For queries, please contact us at <strong>info@tekvora.in</strong>.
        </p>
      </div>

      <div>
        <div class="footer-sig-section">
          <div class="sig-block" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
            <img src="${signatureBase64}" style="max-height: 42px; max-width: 140px; margin-bottom: 4px; object-fit: contain;" />
            <div style="font-size: 12px; font-weight: 700; color: #0d1e3d; margin-top: 2px;">Kamlesh Raut</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">HR</div>
            <div style="font-size: 8.5px; color: #94a3b8; margin-top: 1px;">TekVora Infotech</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 2 -->
    <div class="page doc-outer-border page-two">
      <div style="flex-grow: 1;"></div>
      <div class="footer-banner">
        <div>TeKVora Infotech | U62099MH2024PTC XXXXXX</div>
        <div>www.tekvora.in | ISO 9001:2015 Certified</div>
      </div>
    </div>
  `;
}

export async function downloadOfferLetterPDF(intern: any) {
  try {
    const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
    const signatureBase64 = await getBase64ImageFromUrl(HR_SIGNATURE_URL);
    const htmlContent = getOfferLetterHtml(intern, logoBase64, signatureBase64);
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    const pages = tempDiv.querySelectorAll('.doc-outer-border');
    if (pages.length === 0) {
      tempDiv.remove();
      return;
    }
    
    const doc = new jsPDF('portrait', 'mm', 'a4');
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    tempDiv.remove();
    doc.save(`Offer_Letter_${intern.full_name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generating Offer Letter PDF:", error);
  }
}

export async function downloadLORPDF(intern: any, customRating?: string, customAchievements?: string) {
  try {
    const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
    const signatureBase64 = await getBase64ImageFromUrl(HR_SIGNATURE_URL);
    const htmlContent = getLORHtml(intern, logoBase64, signatureBase64, customRating, customAchievements);
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    const pages = tempDiv.querySelectorAll('.doc-outer-border');
    if (pages.length === 0) {
      tempDiv.remove();
      return;
    }
    
    const doc = new jsPDF('portrait', 'mm', 'a4');
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    tempDiv.remove();
    doc.save(`LOR_${intern.full_name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generating LOR PDF:", error);
  }
}

export async function printOfferLetter(intern: any) {
  try {
    const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
    const signatureBase64 = await getBase64ImageFromUrl(HR_SIGNATURE_URL);
    const htmlContent = getOfferLetterHtml(intern, logoBase64, signatureBase64);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>Offer Letter - ${intern.full_name}</title>
            <style>
              body { margin: 0; background: #ffffff; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      w.document.close();
    }
  } catch (error) {
    console.error("Error printing Offer Letter:", error);
  }
}

export async function printLOR(intern: any, customRating?: string, customAchievements?: string) {
  try {
    const logoBase64 = await getBase64ImageFromUrl(LOGO_URL);
    const signatureBase64 = await getBase64ImageFromUrl(HR_SIGNATURE_URL);
    const htmlContent = getLORHtml(intern, logoBase64, signatureBase64, customRating, customAchievements);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>LOR - ${intern.full_name}</title>
            <style>
              body { margin: 0; background: #ffffff; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      w.document.close();
    }
  } catch (error) {
    console.error("Error printing LOR:", error);
  }
}
