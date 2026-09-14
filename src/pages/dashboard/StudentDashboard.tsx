import { useEffect, useState, useCallback, useRef, ReactNode } from 'react';

export interface LinterIssue {
  line: number;
  type: string;
  error: string;
  desc: string;
  fix?: string;
}

export interface LinterReport {
  passed: boolean;
  totalLines: number;
  filename: string;
  criticalCount: number;
  warningCount: number;
  issues: LinterIssue[];
}

export interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

export interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  answer: string | number;
  explanation?: string;
}

export interface TrackerJob {
  id: string;
  company: string;
  role: string;
  status: string;
  dateApplied?: string;
  date?: string;
}

export interface SavedNote {
  id: string;
  title?: string;
  content: string;
  date?: string;
  courseId?: string;
  time?: string;
}

declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
    pyodideInstance: any;
  }
}
import { Link, useNavigate } from '../../lib/router';
import { BookOpen, Award, LogOut, Upload, CheckCircle, Clock, AlertCircle, ChevronRight, CreditCard, QrCode, Copy, Check, Download, XCircle, Github, Terminal, Trophy, Lock, Eye, Share2, Printer, Video, Radio, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CourseEnrollment, Certificate } from '../../lib/types';
import WhatsAppButton from '../../components/WhatsAppButton';
import { triggerConfetti } from '../../lib/confetti';
import { downloadCertificatePDF, downloadCertificatePNG, printCertificate, getCertificateHtml } from '../../lib/DocumentGenerator';

type Tab = 'courses' | 'certificates' | 'linter' | 'quiz' | 'resume' | 'tracker' | 'videoNotes' | 'profile';

// ─── Level System ─────────────────────────────────────────────────────────────
const LEVELS = [
  { name: 'Novice',     minXp: 0,    maxXp: 100,  color: 'text-gray-400',   bg: 'bg-gray-500',   border: 'border-gray-400',   gradient: 'from-gray-500 to-gray-600' },
  { name: 'Apprentice', minXp: 100,  maxXp: 300,  color: 'text-blue-400',   bg: 'bg-blue-500',   border: 'border-blue-400',   gradient: 'from-blue-500 to-blue-700' },
  { name: 'Developer',  minXp: 300,  maxXp: 600,  color: 'text-green-400',  bg: 'bg-green-500',  border: 'border-green-400',  gradient: 'from-green-500 to-emerald-600' },
  { name: 'Architect',  minXp: 600,  maxXp: 1000, color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-400', gradient: 'from-purple-500 to-violet-700' },
  { name: 'Legend',     minXp: 1000, maxXp: 2000, color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-400', gradient: 'from-orange-500 to-amber-600' },
  { name: 'Master',     minXp: 2000, maxXp: 9999, color: 'text-yellow-300', bg: 'bg-yellow-500', border: 'border-yellow-400', gradient: 'from-yellow-400 to-amber-500' },
];

function getLevelInfo(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) level = l;
    else break;
  }
  const progress = level.maxXp === 9999 ? 100
    : Math.min(100, ((xp - level.minXp) / (level.maxXp - level.minXp)) * 100);
  const xpToNext = level.maxXp === 9999 ? 0 : level.maxXp - xp;
  return { level, progress, xpToNext };
}

// ─── Badge Definitions ────────────────────────────────────────────────────────
interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  check: (data: BadgeData) => boolean;
}

interface BadgeData {
  xp: number;
  streak: number;
  certificates: number;
  github: string;
  enrolledCount: number;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_login',     name: 'First Login',       description: 'Joined TeKVora!',                icon: '🎉', color: 'from-blue-500 to-blue-700',         check: () => true },
  { id: 'streak_starter',  name: 'Streak Starter',    description: '3-day login streak',             icon: '🔥', color: 'from-orange-400 to-orange-600',      check: d => d.streak >= 3 },
  { id: 'streak_champ',    name: 'Streak Champ',      description: '7-day login streak',             icon: '⚡', color: 'from-yellow-400 to-orange-500',      check: d => d.streak >= 7 },
  { id: 'streak_legend',   name: 'Streak Legend',     description: '30-day login streak',            icon: '🏆', color: 'from-red-500 to-rose-700',           check: d => d.streak >= 30 },
  { id: 'xp_collector',    name: 'XP Collector',      description: 'Earned 100+ XP',                 icon: '⭐', color: 'from-amber-400 to-yellow-600',       check: d => d.xp >= 100 },
  { id: 'xp_master',       name: 'XP Master',         description: 'Earned 500+ XP',                 icon: '💎', color: 'from-cyan-400 to-blue-600',          check: d => d.xp >= 500 },
  { id: 'first_cert',      name: 'First Certificate', description: 'Earned your first certificate',  icon: '📜', color: 'from-green-400 to-emerald-600',      check: d => d.certificates >= 1 },
  { id: 'multi_achiever',  name: 'Multi-Achiever',    description: 'Earned 3+ certificates',          icon: '🎓', color: 'from-purple-400 to-violet-600',      check: d => d.certificates >= 3 },
  { id: 'github_conn',     name: 'GitHub Connected',  description: 'Connected GitHub profile',        icon: '🔗', color: 'from-gray-600 to-slate-800',         check: d => d.github.length > 0 },
  { id: 'playground',      name: 'XP Pioneer',        description: 'Earned your first XP',            icon: '🧪', color: 'from-teal-400 to-cyan-600',          check: d => d.xp > 0 },
  { id: 'course_explorer', name: 'Course Explorer',   description: 'Enrolled in 2+ courses',          icon: '🗺️', color: 'from-indigo-400 to-purple-600',      check: d => d.enrolledCount >= 2 },
  { id: 'elite',           name: 'Elite Student',     description: '1000+ XP and 7-day streak',       icon: '👑', color: 'from-yellow-400 to-amber-500',       check: d => d.xp >= 1000 && d.streak >= 7 },
];

// ─── Onboarding goals ─────────────────────────────────────────────────────────
const GOALS = [
  { id: 'webdev',    label: 'Web Dev',     icon: '🌐' },
  { id: 'python',    label: 'Python',      icon: '🐍' },
  { id: 'data',      label: 'Data Science',icon: '📊' },
  { id: 'mobile',    label: 'Mobile App',  icon: '📱' },
  { id: 'uiux',      label: 'UI/UX',       icon: '🎨' },
  { id: 'cloud',     label: 'Cloud',       icon: '☁️' },
];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

const courses = [
  { id: '1', title: 'Full Stack Web Development', duration: '3 Months', skills: ['HTML', 'CSS', 'JS', 'Django', 'MySQL'], fee: 15000, discount: 20 },
  { id: '2', title: 'Python Programming', duration: '6 Weeks', skills: ['Python', 'OOP', 'APIs', 'Data Structures'], fee: 8000, discount: 15 },
  { id: '3', title: 'Data Science with Python', duration: '2 Months', skills: ['Pandas', 'NumPy', 'ML Basics', 'Visualization'], fee: 12000, discount: 10 },
  { id: '4', title: 'Mobile App Development', duration: '2 Months', skills: ['Flutter', 'Dart', 'Firebase', 'UI Design'], fee: 12000, discount: 15 },
  { id: '5', title: 'UI/UX Design', duration: '6 Weeks', skills: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems'], fee: 6000, discount: 10 },
  { id: '6', title: 'React.js Development', duration: '2 Months', skills: ['React', 'Redux', 'Hooks', 'APIs'], fee: 10000, discount: 15 },
  { id: '7', title: 'Node.js Backend Development', duration: '6 Weeks', skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'], fee: 9000, discount: 10 },
  { id: '8', title: 'Cloud Computing (AWS)', duration: '1 Month', skills: ['AWS', 'EC2', 'S3', 'Lambda', 'DevOps'], fee: 15000, discount: 20 },
  // ₹1 Test course
  { id: 'test-1', title: 'Full Stack Web Dev — ₹1 TEST', duration: '1 Week', skills: ['HTML', 'CSS', 'JavaScript'], fee: 1, discount: 0 },
];

const UPI_ID = '9022302322@ptyes';
const UPI_NAME = 'Vaibhav Dnyaneshwar Tambe';

function getQrUrl(amount: number) {
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR`;
  const svgText = generateQRCodeSvg(upiLink, 200);
  return `data:image/svg+xml;base64,${btoa(svgText)}`;
}

function downloadCertificate(cert: Certificate) {
  const verificationUrl = `${window.location.origin}/verify?id=${cert.certificate_id}`;
  const certIdLabel = `TI-${cert.certificate_id.split('-').slice(1).join('-')}`;
  const issueDateStr = new Date(cert.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Certificate - ${cert.certificate_id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Dancing+Script:wght@600&family=Great+Vibes&family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  
  .cert-outer-border {
    width: 880px;
    padding: 18px;
    background-color: #ffffff;
    border: 16px solid #0d1e3d;
    border-radius: 4px;
    position: relative;
    box-shadow: 0 15px 35px rgba(13, 30, 61, 0.2);
    overflow: hidden;
  }
  
  /* Double Gold-Navy borders */
  .cert-outer-border::before {
    content: '';
    position: absolute;
    top: 4px; left: 4px; right: 4px; bottom: 4px;
    border: 2px solid #c9a96e;
    pointer-events: none;
    z-index: 5;
  }

  .cert-inner-border {
    border: 1px solid #c9a96e;
    padding: 28px 32px;
    position: relative;
    background: radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%);
    min-height: 520px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 2;
  }
  
  .cert-corner-dec {
    position: absolute;
    width: 25px;
    height: 25px;
    border: 2px solid #c9a96e;
    z-index: 10;
    pointer-events: none;
  }
  .cert-corner-dec.top-left { top: 6px; left: 6px; border-right: none; border-bottom: none; }
  .cert-corner-dec.top-right { top: 6px; right: 6px; border-left: none; border-bottom: none; }
  .cert-corner-dec.bottom-left { bottom: 6px; left: 6px; border-right: none; border-top: none; }
  .cert-corner-dec.bottom-right { bottom: 6px; right: 6px; border-left: none; border-top: none; }

  /* Giant Watermark Logo */
  .cert-watermark-logo {
    position: absolute;
    top: 50%;
    left: 65%;
    transform: translate(-50%, -50%);
    width: 280px;
    height: 280px;
    opacity: 0.045;
    pointer-events: none;
    z-index: 0;
    user-select: none;
  }
  
  .cert-header {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
    position: relative;
    z-index: 10;
  }
  .logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-img {
    width: 50px;
    height: 50px;
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
    font-weight: 800;
    color: #c9a96e;
    letter-spacing: 2.5px;
    margin-top: 2px;
    text-transform: uppercase;
  }
  .cert-title-section {
    text-align: center;
    margin-bottom: 12px;
    position: relative;
    z-index: 10;
  }
  .main-title {
    font-family: 'Cinzel', serif;
    font-size: 32px;
    font-weight: 800;
    color: #0d1e3d;
    letter-spacing: 8px;
    line-height: 1.1;
  }
  .sub-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: #c9a96e;
    letter-spacing: 4px;
    margin-top: 4px;
  }
  .ornament-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 8px;
  }
  .line-left, .line-right {
    width: 80px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a96e);
  }
  .line-right {
    background: linear-gradient(90deg, #c9a96e, transparent);
  }
  .diamond-center {
    width: 6px;
    height: 6px;
    background-color: #c9a96e;
    transform: rotate(45deg);
  }
  .presented-to {
    text-align: center;
    font-size: 13px;
    color: #64748b;
    font-style: italic;
    margin-bottom: 6px;
    letter-spacing: 1px;
    position: relative;
    z-index: 10;
  }
  .recipient-name {
    text-align: center;
    font-family: 'Cinzel', serif;
    font-size: 36px;
    color: #0d1e3d;
    font-weight: 700;
    letter-spacing: 1.5px;
    margin-bottom: 6px;
    text-decoration: none;
    position: relative;
    z-index: 10;
  }
  .completion-text {
    text-align: center;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 6px;
    position: relative;
    z-index: 10;
  }
  .program-name {
    text-align: center;
    font-family: 'Cinzel', serif;
    font-size: 22px;
    color: #0d1e3d;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 14px;
    position: relative;
    z-index: 10;
  }
  .meta-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #475569;
    margin-bottom: 4px;
    position: relative;
    z-index: 10;
  }
  .meta-divider {
    color: #cbd5e1;
  }
  .cert-id-row {
    text-align: center;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 15px;
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
    margin-top: 15px;
    position: relative;
    z-index: 10;
  }
  .footer-left {
    display: flex;
    align-items: flex-end;
    gap: 25px;
  }
  .gold-seal-container {
    filter: drop-shadow(0 4px 8px rgba(184, 134, 11, 0.35));
  }
  .gold-seal-svg {
    width: 75px;
    height: 75px;
  }
  .qr-verify-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .scan-label-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .scan-label {
    font-size: 7px;
    font-weight: 800;
    color: #475569;
    letter-spacing: 0.5px;
  }
  .checkmark-icon {
    font-size: 6px;
    color: #ffffff;
    background-color: #10b981;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-weight: bold;
  }
  .qr-img {
    width: 54px;
    height: 54px;
    object-fit: contain;
    border: 1px solid #c9a96e;
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
    body { padding:0; background: #fff; }
    .cert-outer-border { box-shadow: none; border-radius: 0; width: 100%; height: 100vh; }
  }
</style>
</head>
<body>
<div class="cert-outer-border">
  <div class="cert-inner-border">
    <!-- Faint Tech Circuit Background Watermark -->
    <svg class="cert-grid-bg" viewBox="0 0 880 520" style="position: absolute; top:0; left:0; width:100%; height:100%; opacity:0.04; pointer-events:none; z-index:1;">
      <path d="M 0 100 L 200 100 L 250 150 L 500 150 L 550 100 L 880 100" fill="none" stroke="#0d1e3d" stroke-width="2"/>
      <path d="M 150 520 L 150 400 L 200 350 L 400 350 L 450 400" fill="none" stroke="#0d1e3d" stroke-width="2"/>
      <path d="M 880 400 L 700 400 L 650 350 L 550 350 L 500 300" fill="none" stroke="#0d1e3d" stroke-width="2"/>
      <circle cx="250" cy="150" r="4" fill="#0d1e3d"/>
      <circle cx="500" cy="150" r="4" fill="#0d1e3d"/>
      <circle cx="200" cy="350" r="4" fill="#0d1e3d"/>
      <circle cx="650" cy="350" r="4" fill="#0d1e3d"/>
    </svg>
    <img src="${window.location.origin}/logorbg.png" class="cert-watermark-logo" alt="watermark" />
    
    <div class="cert-corner-dec top-left"></div>
    <div class="cert-corner-dec top-right"></div>
    <div class="cert-corner-dec bottom-left"></div>
    <div class="cert-corner-dec bottom-right"></div>

    <div class="cert-header">
      <div class="logo-container">
        <img src="${window.location.origin}/logorbg.png" class="cert-img" alt="Logo" />
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
        <div class="line-left"></div>
        <div class="diamond-center"></div>
        <div class="line-right"></div>
      </div>
    </div>

    <p class="presented-to">This is proudly presented to</p>
    <h2 class="recipient-name">${cert.holder_name.toUpperCase()}</h2>
    
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
        <div class="gold-seal-container">
          <svg class="gold-seal-svg" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b8860b" />
                <stop offset="25%" stopColor="#e6ca65" />
                <stop offset="50%" stopColor="#996515" />
                <stop offset="75%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
            <path d="M 60 10 L 64 16 L 71 13 L 74 19 L 81 16 L 83 23 L 89 20 L 91 27 L 97 24 L 98 31 L 103 28 L 103 35 L 108 33 L 107 40 L 111 39 L 109 46 L 112 46 L 109 53 L 112 54 L 108 60 L 110 61 L 106 67 L 107 68 L 103 73 L 103 75 L 99 79 L 99 81 L 94 84 L 93 86 L 88 88 L 86 91 L 81 92 L 78 94 L 73 95 L 70 97 L 65 97 L 61 99 L 56 98 L 52 99 L 47 98 L 43 99 L 39 97 L 35 97 L 30 95 L 28 94 L 23 92 L 21 91 L 16 88 L 15 86 L 11 84 L 10 81 L 6 79 L 6 75 L 2 73 L 3 68 L 0 67 L 1 61 L 0 60 L 3 54 L 0 53 L 3 46 L 1 46 L 4 39 L 2 40 L 6 33 L 5 35 L 10 28 L 10 31 L 15 24 L 16 27 L 22 20 L 24 23 L 30 16 L 33 19 L 39 13 L 43 16 L 50 10 Z" fill="url(#goldGrad)" stroke="#8b7340" strokeWidth="0.5" />
            <circle cx="60" cy="60" r="42" fill="url(#goldGrad)" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,2" />
            <circle cx="60" cy="60" r="38" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            <text x="60" y="52" fontFamily="'Inter', sans-serif" fontSize="6.5" fontWeight="800" fill="#4a3b1a" textAnchor="middle">TEKVORA</text>
            <text x="60" y="62" fontFamily="'Inter', sans-serif" fontSize="6.5" fontWeight="800" fill="#4a3b1a" textAnchor="middle">CERTIFIED</text>
            <text x="60" y="72" fontFamily="'Inter', sans-serif" fontSize="4" fontWeight="600" fill="#4a3b1a" textAnchor="middle" letterSpacing="0.5">COMPLETION</text>
            <text x="60" y="78" fontFamily="'Inter', sans-serif" fontSize="4" fontWeight="600" fill="#4a3b1a" textAnchor="middle" letterSpacing="0.5">EXCELLENCE</text>
          </svg>
        </div>

        <div class="qr-verify-block">
          <div class="scan-label-row">
            <span class="scan-label">SCAN TO VERIFY</span>
            <span class="checkmark-icon">✓</span>
          </div>
          <img src="data:image/svg+xml;base64,${btoa(generateQRCodeSvg(verificationUrl, 150))}" class="qr-img" alt="Verification QR" />
        </div>
      </div>

      <div class="footer-right">
        <img src="/signature.png" class="sig-img" alt="Authorized Signatory" />
      </div>
    </div>
  </div>
</div>
<script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=1024,height=800');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

function generateQRCodeSvg(text: string, size: number): string {
  // Simple QR-like pattern SVG for certificate verification URL
  const cells = 21;
  const cellSize = Math.floor(size / cells);
  const actualSize = cellSize * cells;
  const pattern = generateQRPattern(text);
  let rects = '';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (pattern[r * cells + c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a365d"/>`;
      }
    }
  }
  // Add finder patterns (corners)
  const finder = (fx: number, fy: number) => {
    const s = cellSize;
    return `<rect x="${fx}" y="${fy}" width="${s*7}" height="${s*7}" fill="#1a365d" opacity="0.1"/><rect x="${fx+s}" y="${fy+s}" width="${s*5}" height="${s*5}" fill="#fff"/><rect x="${fx+s*2}" y="${fy+s*2}" width="${s*3}" height="${s*3}" fill="#1a365d"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}">${finder(0,0)}${finder(actualSize-cellSize*7,0)}${finder(0,actualSize-cellSize*7)}${rects}</svg>`;
}

function generateQRPattern(text: string): boolean[] {
  const cells = 21;
  const pattern = new Array(cells * cells).fill(false);
  const hash = cyrb53(text);
  for (let i = 0; i < cells * cells; i++) {
    const row = Math.floor(i / cells);
    const col = i % cells;
    // Skip finder pattern areas
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

// ─── Regex Linter helper (PEP 8 + Syntax checks) ───────────────────────────
function runJsLinter(_filename: string, code: string) {
  const lines = code.split('\n');
  const issues: {line: number; type: string; error: string; desc: string; fix?: string}[] = [];
  
  lines.forEach((line, i) => {
    // 1. Line length warning (PEP 8)
    if (line.length > 79) {
      issues.push({
        line: i + 1,
        type: 'style',
        error: 'PEP 8: Line too long',
        desc: `Line has ${line.length} characters (max 79 recommended).`,
        fix: 'Break line into multiple expressions or shorten variables.'
      });
    }
    
    // 2. Colons after blocks (SyntaxError)
    const colonKeywords = /^\s*(def|class|if|elif|else|for|while|try|except|finally)\b/;
    if (colonKeywords.test(line) && !line.trim().endsWith(':') && !line.includes('#')) {
      issues.push({
        line: i + 1,
        type: 'syntax',
        error: 'SyntaxError: Missing colon',
        desc: 'Block statement headers must end with a colon (:).',
        fix: 'Add a colon (:) at the end of this line.'
      });
    }
    
    // 3. Indentation alignment (Style)
    const indentMatch = line.match(/^(\s*)/);
    const indentSpaces = indentMatch ? indentMatch[1].length : 0;
    if (indentSpaces > 0 && indentSpaces % 4 !== 0) {
      issues.push({
        line: i + 1,
        type: 'style',
        error: 'PEP 8: Indentation warning',
        desc: `Indentation of ${indentSpaces} spaces is not a multiple of 4.`,
        fix: 'Convert indentation to use 4 spaces per block level.'
      });
    }
  });

  // 4. Bracket matching
  const openStack: { char: string; idx: number }[] = [];
  const bracketMap: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (let idx = 0; idx < code.length; idx++) {
    const char = code[idx];
    if (['(', '[', '{'].includes(char)) {
      openStack.push({ char, idx });
    } else if ([')', ']', '}'].includes(char)) {
      const last = openStack.pop();
      if (!last || last.char !== bracketMap[char]) {
        const lineNo = code.substring(0, idx).split('\n').length;
        issues.push({
          line: lineNo,
          type: 'syntax',
          error: 'SyntaxError: Mismatched brackets',
          desc: `Closing bracket '${char}' does not match any opening bracket.`,
          fix: `Ensure you have matching brackets. Add a missing '${bracketMap[char]}' or delete '${char}'.`
        });
        break;
      }
    }
  }

  // 5. Unclosed strings
  let inDouble = false;
  let inSingle = false;
  lines.forEach((line, i) => {
    if (line.includes('"""') || line.includes("'''")) return;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"' && (c === 0 || line[c - 1] !== '\\') && !inSingle) {
        inDouble = !inDouble;
      } else if (line[c] === "'" && (c === 0 || line[c - 1] !== '\\') && !inDouble) {
        inSingle = !inDouble;
      }
    }
    if (inDouble || inSingle) {
      issues.push({
        line: i + 1,
        type: 'syntax',
        error: 'SyntaxError: Unterminated string literal',
        desc: 'Unclosed quotes at the end of the line.',
        fix: `Close the string quote with a matching ${inDouble ? '"' : "'"} quote.`
      });
      inDouble = false;
      inSingle = false;
    }
  });

  return issues;
}

export default function StudentDashboard() {
  const { user, studentProfile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('courses');
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [enrollForm, setEnrollForm] = useState<{ courseId: string; proof: File | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: studentProfile?.full_name || '',
    phone: studentProfile?.phone || '',
    github_username: studentProfile?.github_username || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrollError, setEnrollError] = useState('');

  // ─── Gamification & Streaks States ──────────────────────────────────────────
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [animateStreak, setAnimateStreak] = useState(0);
  const [xpNotification, setXpNotification] = useState<number | null>(null);

  // ─── Onboarding Wizard State ──────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardGoal, setOnboardGoal] = useState('');
  const [onboardSkill, setOnboardSkill] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [onboardGithub, setOnboardGithub] = useState('');

  // ─── GitHub API States ────────────────────────────────────────────────────────
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');

  // ─── Autograder & Linter States ──────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linterState, setLinterState] = useState<'idle' | 'linting' | 'done' | 'error'>('idle');
  const [linterReport, setLinterReport] = useState<LinterReport | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ─── Quiz Tab States ────────────────────────────────────────────────────────
  const [quizNotes, setQuizNotes] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [quizFinished, setQuizFinished] = useState(false);

  // ─── Resume Tab States ──────────────────────────────────────────────────────
  const [resumeRole, setResumeRole] = useState('Full Stack Web Developer');
  const [resumeSkills, setResumeSkills] = useState('React, Python, Django, Tailwind CSS, REST APIs');
  const [resumeProjects, setResumeProjects] = useState('E-Commerce Platform, Peer Review Boards');
  const [resumeExp, setResumeExp] = useState('Freelance developer, completed 3 internships at TeKVora');
  const [resumeResult, setResumeResult] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [linkedinPost, setLinkedinPost] = useState('');

  // ─── Internship Tracker States ──────────────────────────────────────────────
  const [trackerJobs, setTrackerJobs] = useState<TrackerJob[]>(() => {
    const saved = localStorage.getItem('tekvora_internship_tracker');
    return saved ? JSON.parse(saved) : [
      { id: 'tr1', company: 'InnovaTech Solutions', role: 'Python Developer', date: '03 July 2026', status: 'Applied' },
      { id: 'tr2', company: 'TCS Innovation', role: 'React Frontend Intern', date: '01 July 2026', status: 'Interview' }
    ];
  });
  const [newTrackerCompany, setNewTrackerCompany] = useState('');
  const [newTrackerRole, setNewTrackerRole] = useState('');
  const [newTrackerStatus, setNewTrackerStatus] = useState<string>('Applied');

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const certificateContainerRef = useRef<HTMLDivElement>(null);
  const [certPreviewWidth, setCertPreviewWidth] = useState(880);

  // ─── Video Notes States ─────────────────────────────────────────────────────
  const [selectedNoteCourseId, setSelectedNoteCourseId] = useState('1');
  const [videoNoteTime, setVideoNoteTime] = useState('00:00');
  const [videoNoteText, setVideoNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => {
    const saved = localStorage.getItem('tekvora_video_notes_all');
    return saved ? JSON.parse(saved) : [
      { id: 'n1', courseId: '1', time: '02:45', content: 'Flexbox requires flex-direction row or column to map axes.' }
    ];
  });

  useEffect(() => {
    if (!certificateContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCertPreviewWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(certificateContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [selectedCertificate]);

  const certScaleFactor = certPreviewWidth / 880;

  // Load Pyodide script globally in student dashboard in background
  useEffect(() => {
    if (window.loadPyodide) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch GitHub portfolios
  const fetchGithubRepos = async (username: string) => {
    if (!username.trim()) {
      setRepos([]);
      return;
    }
    setLoadingRepos(true);
    setRepoError('');
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`);
      if (!res.ok) {
        throw new Error('User not found or GitHub API limit reached.');
      }
      const data = await res.json();
      setRepos(data);
    } catch (err: unknown) {
      setRepoError((err as Error).message || 'Failed to load GitHub portfolio.');
      setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Gamification: Streak calculation & Profile sync
  useEffect(() => {
    if (!user) return;

    // Load local gamification cache
    const storedXp = parseInt(localStorage.getItem(`tekvora_xp_${user.id}`) || '0', 10);
    const activeXp = studentProfile?.xp || storedXp;
    setXp(activeXp);
    localStorage.setItem(`tekvora_xp_${user.id}`, activeXp.toString());

    const streakKey = `tekvora_streak_${user.id}`;
    const lastLoginKey = `tekvora_last_login_${user.id}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLogin = localStorage.getItem(lastLoginKey);
    let currentStreak = studentProfile?.streak || parseInt(localStorage.getItem(streakKey) || '0', 10);

    if (!lastLogin) {
      currentStreak = 1;
      localStorage.setItem(streakKey, '1');
      localStorage.setItem(lastLoginKey, todayStr);
    } else if (lastLogin !== todayStr) {
      const lastLoginDate = new Date(lastLogin);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastLoginDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
        localStorage.setItem(streakKey, currentStreak.toString());
        localStorage.setItem(lastLoginKey, todayStr);
      } else if (diffDays > 1) {
        currentStreak = 1;
        localStorage.setItem(streakKey, '1');
        localStorage.setItem(lastLoginKey, todayStr);
      }
    }

    setStreak(currentStreak);

    // Sync to Supabase
    const syncProfile = async () => {
      try {
        await supabase
          .from('student_profiles')
          .update({
            xp: activeXp,
            streak: currentStreak,
            last_login_date: todayStr
          })
          .eq('id', user.id);
      } catch (err) {
        console.error('Error syncing profile statistics:', err);
      }
    };
    syncProfile();

    // Ticking animation for fire streak badge
    let start = 0;
    const end = currentStreak;
    if (end > 0) {
      const duration = 1000;
      const step = end / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          clearInterval(timer);
          setAnimateStreak(end);
        } else {
          setAnimateStreak(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [user, studentProfile]);

  // Load GitHub repos when username is loaded/saved
  useEffect(() => {
    if (!user) return;
    const storedUsername = localStorage.getItem(`tekvora_github_${user.id}`);
    const activeUsername = studentProfile?.github_username || storedUsername || '';
    if (activeUsername) {
      fetchGithubRepos(activeUsername);
    }
  }, [studentProfile, user]);

  // ─── Onboarding Wizard trigger ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem('tekvora_onboarding_done');
    if (!done) {
      // Delay slightly so profile loads first
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      setProfileForm({
        full_name: studentProfile.full_name,
        phone: studentProfile.phone || '',
        github_username: studentProfile.github_username || ''
      });
    }
  }, [studentProfile]);

  const loadData = useCallback(async () => {
    if (!user) return;
    // FIX: use select('*') — no FK join since course_id is now text
    const [enrollRes, certRes, classesRes] = await Promise.all([
      supabase.from('course_enrollments').select('*').eq('student_id', user.id),
      supabase.from('certificates').select('*').eq('student_id', user.id),
      supabase.from('scheduled_classes').select('*').order('date', { ascending: true }),
    ]);
    setEnrollments((enrollRes.data || []) as CourseEnrollment[]);
    setCertificates((certRes.data || []) as Certificate[]);
    setScheduledClasses((classesRes.data || []) as any[]);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user, navigate, loadData]);

  const handleEnroll = (courseId: string) => {
    setEnrollSuccess('');
    setEnrollError('');
    setEnrollForm({ courseId, proof: null });
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitEnrollment = async () => {
    if (!enrollForm || !user) return;
    if (!enrollForm.proof) { setEnrollError('Please upload payment screenshot before submitting.'); return; }
    setUploading(true);
    setEnrollError('');

    const ext = enrollForm.proof.name.split('.').pop();
    const fileName = `${user.id}/${enrollForm.courseId}_${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, enrollForm.proof, { upsert: true });

    if (uploadErr) {
      setEnrollError('Upload failed. Please try a smaller image (under 5MB) and try again.');
      setUploading(false);
      return;
    }
    const proof_url = uploadData?.path;

    // FIX: course_id is now text, so string IDs '1', '2', 'test-1' work correctly
    const { error: insertErr } = await supabase.from('course_enrollments').insert({
      student_id: user.id,
      course_id: enrollForm.courseId,
      payment_proof_url: proof_url,
      status: 'pending_payment',
      payment_approved: false,
    });

    if (insertErr) {
      setEnrollError(`Enrollment failed: ${insertErr.message}`);
    } else {
      setEnrollSuccess('Enrollment submitted! Admin will verify your payment within 24 hours.');
      setEnrollForm(null);
      await loadData();
    }
    setUploading(false);
  };

  const runPyodideLinter = async (code: string) => {
    if (!window.loadPyodide) return null;
    
    try {
      if (!window.pyodideInstance) {
        window.pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
        });
      }
      
      const py = window.pyodideInstance;
      const runRes = py.runPython(`
import ast

def audit_code(code_str):
    try:
        ast.parse(code_str)
        return "SUCCESS"
    except SyntaxError as e:
        return f"ERROR:{e.lineno}:{e.msg}"
    except Exception as e:
        return f"ERROR:1:{str(e)}"

audit_code(${JSON.stringify(code)})
      `);
      
      if (runRes === "SUCCESS") {
        return [];
      } else if (runRes.startsWith("ERROR:")) {
        const parts = runRes.split(":");
        const lineNo = parseInt(parts[1], 10) || 1;
        const msg = parts.slice(2).join(":");
        return [{
          line: lineNo,
          type: 'syntax',
          error: 'SyntaxError (WASM Verified)',
          desc: msg,
          fix: 'Check if you have missing brackets, colons, or syntax typos on this line.'
        }];
      }
    } catch (err) {
      console.error("Pyodide linter failed:", err);
    }
    return null;
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!user) return;
    const key = `mod_completed_${user.id}_${moduleId}`;
    if (localStorage.getItem(key) === 'true') return;

    localStorage.setItem(key, 'true');
    
    const newXp = xp + 50;
    setXp(newXp);
    localStorage.setItem(`tekvora_xp_${user.id}`, newXp.toString());
    
    try {
      await supabase
        .from('student_profiles')
        .update({ xp: newXp })
        .eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to sync XP to database:", err);
    }

    setXpNotification(50);
    setTimeout(() => setXpNotification(null), 3000);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    localStorage.setItem(`tekvora_github_${user.id}`, profileForm.github_username);
    await supabase.from('student_profiles').update(profileForm).eq('id', user.id);
    await refreshProfile();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
    setSavingProfile(false);
  };

  // ─── File Upload & Linter Logic ──────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.py')) {
        setSelectedFile(file);
        runFileLinter(file);
      } else {
        alert("Please upload only Python (.py) files!");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.py')) {
        setSelectedFile(file);
        runFileLinter(file);
      } else {
        alert("Please upload only Python (.py) files!");
      }
    }
  };

  const runFileLinter = (file: File) => {
    setLinterState('linting');
    setLinterReport(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const code = event.target?.result as string;
      const jsIssues = runJsLinter(file.name, code);
      
      let pyIssues: {line: number; type: string; error: string; desc: string; fix?: string}[] = [];
      if (window.loadPyodide) {
        const result = await runPyodideLinter(code);
        if (result) pyIssues = result;
      }
      
      const hasCriticalError = pyIssues.length > 0;
      let finalIssues = [...pyIssues];
      
      if (!hasCriticalError) {
        finalIssues = [...finalIssues, ...jsIssues];
      } else {
        jsIssues.forEach((issue) => {
          if (!finalIssues.some((f) => f.line === issue.line)) {
            finalIssues.push(issue);
          }
        });
      }
      
      finalIssues.sort((a, b) => a.line - b.line);
      
      const totalChecked = code.split('\n').length;
      const criticalCount = finalIssues.filter(i => i.type === 'syntax').length;
      const warningCount = finalIssues.filter(i => i.type === 'style').length;
      const passed = criticalCount === 0;

      setLinterReport({
        filename: file.name,
        passed,
        issues: finalIssues,
        criticalCount,
        warningCount,
        totalLines: totalChecked
      });
      setLinterState('done');
    };
    reader.onerror = () => {
      setLinterState('error');
    };
    reader.readAsText(file);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const getEnrollment = (courseId: string) => enrollments.find(e => e.course_id === courseId);
  const getCourse = (courseId: string) => courses.find(c => c.id === courseId);

  // ─── Onboarding complete handler ─────────────────────────────────────────
  const completeOnboarding = async () => {
    localStorage.setItem('tekvora_onboarding_goal', onboardGoal);
    localStorage.setItem('tekvora_onboarding_level', onboardSkill);
    localStorage.setItem('tekvora_onboarding_done', 'true');
    if (user && onboardGithub.trim()) {
      await supabase.from('student_profiles').update({ github_username: onboardGithub.trim() }).eq('id', user.id);
      await refreshProfile();
    }
    setShowOnboarding(false);
    triggerConfetti();
  };

  // ─── Quiz Handlers ───────────────────────────────────────────────────────
  const handleGenerateQuiz = () => {
    if (!quizNotes.trim()) return;
    setQuizLoading(true);
    setTimeout(() => {
      const mockQuestions = [
        { question: 'What is the standard indentation recommended by PEP 8?', options: ['2 spaces', '4 spaces', '1 tab', 'No indentation'], answer: '4 spaces', explanation: 'PEP 8 specifies that 4 spaces per indentation level should be used.' },
        { question: 'Which keyword is used to return a generator in Python?', options: ['return', 'generator', 'yield', 'def'], answer: 'yield', explanation: 'The yield statement suspends function execution and returns a generator iterator.' },
        { question: 'Is Python pass statement a null statement?', options: ['Yes', 'No', 'Depends on execution', 'Only in loops'], answer: 'Yes', explanation: 'The pass statement is a null operation. Nothing happens when it executes.' },
        { question: 'Which data structure is mutable in Python?', options: ['Tuple', 'List', 'String', 'Integer'], answer: 'List', explanation: 'Lists are mutable sequences, whereas tuples and strings are immutable.' },
        { question: 'What does WASM stand for?', options: ['Web Assembly', 'Web Application State Model', 'Web Asynchronous Script Manager', 'Web Analytics Security Map'], answer: 'Web Assembly', explanation: 'WASM stands for WebAssembly.' }
      ];
      setQuizQuestions(mockQuestions);
      setQuizIdx(0);
      setQuizScore(0);
      setSelectedOption('');
      setQuizFinished(false);
      setQuizActive(true);
      setQuizLoading(false);
    }, 1500);
  };

  const handleAnswerQuiz = (opt: string) => {
    setSelectedOption(opt);
    const correct = opt === quizQuestions[quizIdx].answer;
    if (correct) setQuizScore(s => s + 1);

    setTimeout(() => {
      const next = quizIdx + 1;
      if (next >= quizQuestions.length) {
        setQuizFinished(true);
        setXp(x => x + 30);
        setXpNotification(30);
        triggerConfetti();
      } else {
        setQuizIdx(next);
        setSelectedOption('');
      }
    }, 1500);
  };

  // ─── Resume Handlers ─────────────────────────────────────────────────────
  const handleGenerateResume = () => {
    setResumeLoading(true);
    setTimeout(() => {
      const resume = `=========================================\n${studentProfile?.full_name || 'STUDENT PROFILE'}\n=========================================\n\nROLE: ${resumeRole}\n\nTECHNICAL SKILLS:\n${resumeSkills}\n\nPROJECTS:\n${resumeProjects}\n\nWORK EXPERIENCE:\n${resumeExp}\n\nGenerated via TeKVora AI Engine. Ready for corporate application logs.`;
      const linkedin = `🎉 Thrilled to announce that I have completed advanced certification training with TeKVora Infotech! Highly recommend their hands-on courses. Ready to take on new opportunities as a ${resumeRole}.\n\n#TeKVora #Coding #Developer #Placement`;
      setResumeResult(resume);
      setLinkedinPost(linkedin);
      setResumeLoading(false);
      triggerConfetti();
    }, 1500);
  };

  // ─── Tracker Handlers ────────────────────────────────────────────────────
  const handleAddTrackerJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackerCompany || !newTrackerRole) return;
    const newJob = {
      id: Date.now().toString(),
      company: newTrackerCompany,
      role: newTrackerRole,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: newTrackerStatus
    };
    const nextJobs = [...trackerJobs, newJob];
    setTrackerJobs(nextJobs);
    localStorage.setItem('tekvora_internship_tracker', JSON.stringify(nextJobs));
    setNewTrackerCompany('');
    setNewTrackerRole('');
    triggerConfetti();
  };

  const handleMoveTrackerJob = (id: string, nextStatus: string) => {
    const nextJobs = trackerJobs.map(j => j.id === id ? { ...j, status: nextStatus } : j);
    setTrackerJobs(nextJobs);
    localStorage.setItem('tekvora_internship_tracker', JSON.stringify(nextJobs));
  };

  const handleDeleteTrackerJob = (id: string) => {
    const nextJobs = trackerJobs.filter(j => j.id !== id);
    setTrackerJobs(nextJobs);
    localStorage.setItem('tekvora_internship_tracker', JSON.stringify(nextJobs));
  };

  // ─── Video Notes Handlers ────────────────────────────────────────────────
  const handleAddVideoNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      courseId: selectedNoteCourseId,
      time: videoNoteTime,
      content: videoNoteText.trim()
    };
    const nextNotes = [newNote, ...savedNotes];
    setSavedNotes(nextNotes);
    localStorage.setItem('tekvora_video_notes_all', JSON.stringify(nextNotes));
    setVideoNoteText('');
  };

  const handleDeleteVideoNote = (id: string) => {
    const nextNotes = savedNotes.filter(n => n.id !== id);
    setSavedNotes(nextNotes);
    localStorage.setItem('tekvora_video_notes_all', JSON.stringify(nextNotes));
  };

  const handleExportVideoNotes = () => {
    const courseNotes = savedNotes.filter(n => n.courseId === selectedNoteCourseId);
    if (courseNotes.length === 0) return;
    const txt = courseNotes.map(n => `[${n.time}] ${n.content}`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_course_${selectedNoteCourseId}.txt`;
    link.click();
  };

  // ─── Badge data computation ───────────────────────────────────────────────
  const badgeData: BadgeData = {
    xp,
    streak,
    certificates: certificates.length,
    github: studentProfile?.github_username || '',
    enrolledCount: enrollments.length,
  };
  const { level: currentLevel, progress: levelProgress, xpToNext } = getLevelInfo(xp);

  return (
    <div className="min-h-screen bg-gray-50 font-poppins relative">
      {/* XP Toast Notification */}
      {xpNotification !== null && (
        <div className="fixed bottom-10 right-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce border border-orange-400">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
            🎓
          </div>
          <div>
            <h4 className="font-bold text-sm">Learning Progress!</h4>
            <p className="text-xs text-orange-100">+{xpNotification} XP added to profile</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><img src="/new_logo.png" alt="TeKVora" className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800">{studentProfile?.full_name || user?.email}</p>
              <p className="text-xs text-primary-600 font-mono">{studentProfile?.student_id}</p>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm border border-white/30">
              {(studentProfile?.full_name || user?.email || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{studentProfile?.full_name || 'Student'}</h1>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-mono backdrop-blur-sm">{studentProfile?.student_id || 'Loading...'}</span>
                <span className="bg-green-400/20 text-green-200 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Active Student
                </span>
                <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold animate-pulse shadow-sm">
                  🔥 {animateStreak} Day Streak
                </span>
                <span className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm">
                  ⭐ {xp} XP
                </span>
                {/* Level Badge */}
                <span className={`bg-gradient-to-r ${currentLevel.gradient} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm`}>
                  🏅 {currentLevel.name}
                </span>
              </div>
              {/* XP Progress Bar to next level */}
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-[10px] text-blue-200 mb-1">
                  <span>{currentLevel.name} → {currentLevel.maxXp < 9999 ? LEVELS[LEVELS.findIndex(l=>l.name===currentLevel.name)+1]?.name || 'Max' : 'MAX LEVEL'}</span>
                  <span>{currentLevel.maxXp < 9999 ? `${xpToNext} XP to next` : 'Legendary!'}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${currentLevel.gradient} rounded-full transition-all duration-700`}
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-300 mt-0.5">{Math.round(levelProgress)}% to next level</p>
              </div>
            </div>
            <div className="sm:ml-auto text-right">
              <p className="text-blue-200 text-xs">Member since</p>
              <p className="text-white font-medium text-sm">
                {studentProfile?.created_at ? new Date(studentProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Enrolled', value: enrollments.length, color: 'text-primary-600 bg-primary-50' },
            { icon: CheckCircle, label: 'Approved', value: enrollments.filter(e => e.payment_approved).length, color: 'text-green-600 bg-green-50' },
            { icon: Award, label: 'Certificates', value: certificates.length, color: 'text-orange-600 bg-orange-50' },
            { icon: Clock, label: 'Pending', value: enrollments.filter(e => !e.payment_approved).length, color: 'text-yellow-600 bg-yellow-50' },
          ].map((stat, i) => (
            <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Success/Error global */}
        {enrollSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{enrollSuccess}</p>
          </div>
        )}

        {/* Enrolled courses summary */}
        {enrollments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">My Enrollments</h3>
            <div className="space-y-2">
              {enrollments.map(e => {
                const course = getCourse(e.course_id);
                return (
                  <div key={e.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${e.payment_approved ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                    <div className="flex items-center gap-3">
                      {e.payment_approved
                        ? <CheckCircle size={16} className="text-green-500" />
                        : <Clock size={16} className="text-yellow-600" />}
                      <span className="text-sm font-medium text-gray-800">{course?.title || `Course #${e.course_id}`}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${e.payment_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {e.payment_approved ? 'Active' : 'Pending Verification'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs & Navigation Shortcuts */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['courses', 'certificates', 'linter', 'quiz', 'resume', 'tracker', 'videoNotes', 'profile'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'linter' ? 'Python Linter' : t === 'videoNotes' ? 'Video Notes' : t}
                {t === 'certificates' && certificates.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">{certificates.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <Link
              to="/leaderboard"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
            >
              <Trophy size={14} className="text-amber-500" /> Leaderboard
            </Link>
            <Link
              to={`/portfolio/${user?.id}`}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
            >
              <Award size={14} className="text-primary-600" /> My Public Resume
            </Link>
          </div>
        </div>

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div className="space-y-4">
            {/* Live Lectures / Scheduled Classes Section */}
            {scheduledClasses.length > 0 && (
              <div className="bg-gradient-to-r from-violet-900/90 to-primary-900 text-white rounded-2xl p-6 shadow-md border border-violet-700/50 mb-6">
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                      <Radio size={18} className="text-red-400" /> Live Interactive Lectures & Workshops
                    </h3>
                  </div>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-violet-200 backdrop-blur-sm">
                    {scheduledClasses.length} Scheduled
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scheduledClasses.map((cls: any) => {
                    const classDate = cls.date ? new Date(cls.date) : null;
                    const isPast = classDate ? classDate < new Date() : false;
                    return (
                      <div key={cls.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col justify-between gap-3 hover:bg-white/15 transition-colors">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-white line-clamp-1">{cls.title}</h4>
                            {isPast ? (
                              <span className="text-[10px] bg-white/20 text-gray-300 px-2 py-0.5 rounded-full">Past</span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">Upcoming</span>
                            )}
                          </div>
                          {cls.instructor && (
                            <p className="text-xs text-violet-200">Instructor: <span className="text-white font-medium">{cls.instructor}</span></p>
                          )}
                          <p className="text-xs text-violet-300 mt-1 flex items-center gap-1.5">
                            <Calendar size={13} /> {classDate ? classDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : cls.date}
                          </p>
                          {cls.description && (
                            <p className="text-xs text-gray-300 mt-2 line-clamp-2">{cls.description}</p>
                          )}
                        </div>
                        <a
                          href={cls.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center bg-white hover:bg-violet-50 text-violet-950 font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Video size={14} className="text-violet-700" /> Join Live Lecture
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>How to enroll:</strong> Click "Enroll Now" → Pay via UPI → Upload screenshot → Admin verifies within 24 hrs.
                <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">Test with ₹1 course below!</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map(course => {
                const enrollment = getEnrollment(course.id);
                const discountedFee = course.discount > 0 ? course.fee - (course.fee * course.discount / 100) : course.fee;
                const isTest = course.id === 'test-1';
                return (
                  <div key={course.id} className={`card overflow-hidden group ${isTest ? 'ring-2 ring-orange-400' : ''}`}>
                    <div className={`h-24 flex items-center justify-center relative ${isTest ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-primary-600 to-primary-800'}`}>
                      <BookOpen size={36} className="text-white/30" />
                      {isTest && (
                        <div className="absolute top-2 left-2 bg-white text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                          TEST ₹1
                        </div>
                      )}
                      {course.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {course.discount}% OFF
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                        {course.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{course.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-bold text-sm ${isTest ? 'text-orange-600' : 'text-primary-600'}`}>
                          ₹{discountedFee.toLocaleString()}
                        </span>
                        {course.discount > 0 && (
                          <span className="text-gray-400 text-xs line-through">₹{course.fee.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.skills.slice(0, 3).map(s => <span key={s} className="badge-blue text-xs">{s}</span>)}
                        {course.skills.length > 3 && <span className="badge-blue text-xs">+{course.skills.length - 3}</span>}
                      </div>
                      {enrollment ? (
                        <div className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${
                          enrollment.payment_approved
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {enrollment.payment_approved ? '✓ Active — Access Granted' : '⏳ Pending Admin Verification'}
                        </div>
                      ) : (
                        <button onClick={() => handleEnroll(course.id)}
                          className={`w-full text-white py-2 rounded-lg text-xs font-semibold transition-colors ${isTest ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Learning Modules Section */}
            {enrollments.some(e => e.payment_approved) && (
              <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="text-primary-600 animate-pulse" size={18} />
                  Active Learning Modules
                </h3>
                <div className="space-y-4">
                  {enrollments.filter(e => e.payment_approved).map(e => {
                    const course = getCourse(e.course_id);
                    if (!course) return null;
                    
                    const modules = [
                      { id: `${e.course_id}_m1`, title: 'Module 1: Foundations and Setup' },
                      { id: `${e.course_id}_m2`, title: 'Module 2: Practical Exercises & Implementations' },
                      { id: `${e.course_id}_m3`, title: 'Module 3: Project Submission & Review' }
                    ];

                    return (
                      <div key={e.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                        <h4 className="font-semibold text-gray-800 text-xs mb-2 uppercase tracking-wider">{course.title}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {modules.map(mod => {
                            const isCompleted = localStorage.getItem(`mod_completed_${user?.id}_${mod.id}`) === 'true';
                            return (
                              <div key={mod.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                                isCompleted ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/40 border-gray-200 hover:bg-gray-50'
                              }`}>
                                <span className="text-xs font-semibold text-gray-700 leading-normal">{mod.title}</span>
                                <button
                                  onClick={() => handleToggleModule(mod.id)}
                                  disabled={isCompleted}
                                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all text-center w-fit ${
                                    isCompleted
                                      ? 'bg-green-500 text-white cursor-default'
                                      : 'bg-primary-600 hover:bg-primary-700 text-white active:scale-97 hover:scale-103'
                                  }`}
                                >
                                  {isCompleted ? '✓ Completed (+50 XP)' : 'Mark Completed'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Enroll Modal */}
            {enrollForm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">Complete Enrollment</h3>
                    <button onClick={() => { setEnrollForm(null); setEnrollError(''); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                      <XCircle size={20} />
                    </button>
                  </div>

                  {(() => {
                    const course = getCourse(enrollForm.courseId);
                    if (!course) return null;
                    const discountedFee = course.discount > 0 ? course.fee - (course.fee * course.discount / 100) : course.fee;
                    const isPriceInvalid = !discountedFee || isNaN(discountedFee) || discountedFee <= 0;
                    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${discountedFee}&cu=INR`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
                    return (
                      <>
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{course.title}</p>
                            <p className="text-xs text-gray-500">{course.duration}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-600">₹{discountedFee.toLocaleString()}</p>
                            {course.discount > 0 && <p className="text-xs text-gray-400 line-through">₹{course.fee.toLocaleString()}</p>}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5 mb-4">
                          <p className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <QrCode size={16} className="text-primary-600" /> Pay via UPI
                          </p>
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            {isPriceInvalid ? (
                              <div className="w-40 h-40 flex items-center justify-center border border-red-200 rounded-xl bg-red-50 text-red-600 text-xs p-2 text-center flex-shrink-0">
                                Invalid or missing course fee. Please contact support.
                              </div>
                            ) : (
                              <div className="bg-white p-3 rounded-xl shadow-sm flex-shrink-0">
                                <img src={qrUrl} alt="UPI QR" className="w-40 h-40 object-contain rounded-lg" />
                              </div>
                            )}
                            <div className="flex-1 w-full">
                              <div className="bg-white rounded-xl p-3 mb-3">
                                <p className="text-xs text-gray-400 mb-1">UPI ID — tap to copy</p>
                                <div className="flex items-center gap-2">
                                  <code className="text-primary-700 font-mono font-bold text-base flex-1">{UPI_ID}</code>
                                  <button onClick={copyUpiId} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CreditCard size={14} className="text-primary-500" />
                                <span><strong>{UPI_NAME}</strong></span>
                              </div>
                              <p className="text-xs text-orange-600 font-semibold mt-2">
                                Pay exactly ₹{discountedFee.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Payment Screenshot <span className="text-red-500">*</span>
                          </label>
                          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${enrollForm.proof ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-400 bg-gray-50'}`}>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">
                                {enrollForm.proof ? `✓ ${enrollForm.proof.name}` : 'Click to upload payment screenshot'}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — max 5MB</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enrollForm.proof ? 'bg-green-100' : 'bg-primary-50'}`}>
                              <Upload size={18} className={enrollForm.proof ? 'text-green-600' : 'text-primary-600'} />
                            </div>
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f && f.size > 5 * 1024 * 1024) {
                                  setEnrollError('File too large. Max 5MB allowed.');
                                } else {
                                  setEnrollError('');
                                  setEnrollForm(prev => prev ? { ...prev, proof: f || null } : null);
                                }
                              }} />
                          </label>
                        </div>

                        {enrollError && (
                          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{enrollError}</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={() => { setEnrollForm(null); setEnrollError(''); }}
                            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                          <button onClick={submitEnrollment} disabled={uploading || !enrollForm.proof}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                            {uploading ? (
                              <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Uploading...</>
                            ) : 'Submit Enrollment'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Certificate Viewer Modal */}
            {selectedCertificate && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                  {/* Left/Top: Scaled Certificate Preview */}
                  <div className="flex-1 bg-slate-900 p-6 flex flex-col items-center justify-center min-h-[350px] md:min-h-0 relative">
                    <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700 font-medium">
                      Preview (Landscape A4)
                    </div>
                    <div ref={certificateContainerRef} className="w-full max-w-[500px] md:max-w-none flex items-center justify-center">
                      <div className="relative w-full aspect-[880/620] overflow-hidden rounded-lg shadow-2xl bg-white border border-slate-800">
                        <iframe
                          title="Certificate Preview"
                          srcDoc={getCertificateHtml(
                            selectedCertificate,
                            `${window.location.origin}/verify/${selectedCertificate.certificate_id}`,
                            '/logorbg.png',
                            '/signature.png',
                            { forDownload: false }
                          )}
                          className="absolute top-0 left-0 border-0 origin-top-left"
                          style={{
                            width: '880px',
                            height: '620px',
                            transform: `scale(${certScaleFactor})`,
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right/Bottom: Information & Controls */}
                  <div className="w-full md:w-[320px] bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="inline-block text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/30 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                            Certificate Verified
                          </span>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                            {selectedCertificate.program_name}
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedCertificate(null)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                          <XCircle size={20} />
                        </button>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Certificate ID</label>
                          <p className="font-mono text-sm text-gray-800 dark:text-slate-200 font-semibold">{selectedCertificate.certificate_id}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Date Issued</label>
                          <p className="text-sm text-gray-800 dark:text-slate-300 font-medium">
                            {new Date(selectedCertificate.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        {selectedCertificate.duration && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Duration</label>
                            <p className="text-sm text-gray-800 dark:text-slate-300 font-medium">{selectedCertificate.duration}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => downloadCertificatePDF(selectedCertificate)}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-600/10">
                        <Download size={16} /> Download PDF (300 DPI)
                      </button>
                      <button
                        onClick={() => downloadCertificatePNG(selectedCertificate)}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 dark:text-slate-300 py-3 rounded-xl text-sm font-semibold transition-all">
                        <Download size={16} /> Download PNG Image
                      </button>
                      <button
                        onClick={() => printCertificate(selectedCertificate)}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 dark:text-slate-300 py-3 rounded-xl text-sm font-semibold transition-all">
                        <Printer size={16} /> Print Certificate
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/verify/${selectedCertificate.certificate_id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 dark:text-slate-300 py-3 rounded-xl text-sm font-semibold transition-all">
                        <Share2 size={16} /> {copiedLink ? 'Link Copied!' : 'Share Certificate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Python Linter Tab */}
        {tab === 'linter' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Terminal className="text-primary-600 animate-pulse" size={22} />
                Python Linter & Autograder
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Upload your Python code file (.py) to validate syntax errors, formatting issues, and receive recommendations matching PEP 8 guidelines.
              </p>

              {/* Drag and Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative ${
                  dragActive ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 hover:border-primary-400 bg-gray-50/30'
                }`}
              >
                <input
                  type="file"
                  accept=".py"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="python-file-input"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop your .py file here'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse from files</p>
                  </div>
                </div>
              </div>

              {/* Linter Loading State */}
              {linterState === 'linting' && (
                <div className="mt-8 flex flex-col items-center justify-center p-10 bg-gray-50 rounded-2xl border border-gray-100 gap-3">
                  <span className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm text-gray-500 font-medium">Running AST analysis & syntax audits...</p>
                </div>
              )}

              {/* Report output */}
              {linterState === 'done' && linterReport && (
                <div className="mt-8 space-y-6">
                  {/* Summary Card */}
                  <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    linterReport.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                        linterReport.passed ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {linterReport.passed ? <CheckCircle size={24} /> : <XCircle size={24} />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-lg ${linterReport.passed ? 'text-green-800' : 'text-red-800'}`}>
                          {linterReport.passed ? 'Audit Passed: Code is Clean!' : 'Audit Failed: Syntax Errors Found'}
                        </h4>
                        <p className={`text-sm ${linterReport.passed ? 'text-green-600' : 'text-red-600'}`}>
                          Checked {linterReport.totalLines} lines in <code className="font-mono bg-white/50 px-1 py-0.5 rounded text-xs">{linterReport.filename}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 self-start sm:self-auto">
                      <div className="text-center bg-white/80 border border-black/5 px-4 py-2 rounded-xl">
                        <span className="block text-xl font-bold text-gray-900">{linterReport.criticalCount}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Critical Errors</span>
                      </div>
                      <div className="text-center bg-white/80 border border-black/5 px-4 py-2 rounded-xl">
                        <span className="block text-xl font-bold text-gray-900">{linterReport.warningCount}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Style Warnings</span>
                      </div>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-bold text-gray-800 text-sm">Detailed Audit Log</h4>
                      <span className="text-xs text-gray-400">{linterReport.issues.length} issues detected</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th className="w-16">Line</th>
                            <th className="w-24">Type</th>
                            <th>Issue Description</th>
                            <th>Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linterReport.issues.map((issue: {line: number; type: string; error: string; desc: string; fix?: string}, index: number) => (
                            <tr key={index}>
                              <td className="font-mono font-bold text-gray-600">{issue.line}</td>
                              <td>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                                  issue.type === 'syntax' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {issue.type}
                                </span>
                              </td>
                              <td>
                                <p className="font-semibold text-gray-800 text-sm">{issue.error}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{issue.desc}</p>
                              </td>
                              <td className="text-xs text-primary-700 bg-primary-50/20 p-3 font-medium">
                                {issue.fix}
                              </td>
                            </tr>
                          ))}
                          {linterReport.issues.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-sm text-gray-400">
                                ✨ PEP 8 compliant and compile-ready! No issues detected.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {tab === 'certificates' && (
          <div>
            {certificates.length === 0 ? (
              <div className="text-center py-20">
                <Award size={56} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-500 text-lg">No Certificates Yet</h3>
                <p className="text-gray-400 text-sm mt-2">Complete a course and admin will issue your certificate here.</p>
                <button onClick={() => setTab('courses')} className="mt-5 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                  Browse Courses
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Your certificates are generated as a PDF when you download — no file is stored on our servers.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {certificates.map(cert => (
                    <div key={cert.id} className="card p-6 border-l-4 border-primary-500 hover:shadow-card-hover transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                          <Award size={24} className="text-primary-600" />
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cert.is_revoked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                          {cert.is_revoked ? 'Revoked' : 'Verified'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{cert.program_name}</h3>
                      <p className="text-gray-400 text-xs font-mono mb-1">{cert.certificate_id}</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Issued: {new Date(cert.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {cert.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {cert.skills.map(s => <span key={s} className="badge-blue text-xs">{s}</span>)}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCertificate(cert)}
                          disabled={cert.is_revoked}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                          <Eye size={15} /> View Certificate
                        </button>
                        <Link to={`/verify/${cert.certificate_id}`}
                          className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium flex items-center gap-1 transition-colors">
                          <ChevronRight size={14} /> Verify
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {tab === 'quiz' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">AI MCQ Quiz from Notes</h3>
              <p className="text-xs text-gray-400 mt-1">Paste your study notes below to auto-generate a 5-question review quiz.</p>
            </div>

            {!quizActive ? (
              <div className="space-y-4">
                <textarea
                  value={quizNotes}
                  onChange={e => setQuizNotes(e.target.value)}
                  placeholder="Paste your study notes, module texts, or summaries here..."
                  className="input-field h-40 resize-none outline-none text-xs leading-relaxed"
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading || !quizNotes.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {quizLoading ? 'Generating with AI...' : 'Generate Quiz (+30 XP)'}
                </button>
              </div>
            ) : quizFinished ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h3 className="font-extrabold text-gray-950 dark:text-white text-lg">Quiz Complete!</h3>
                <p className="text-sm text-gray-655 dark:text-slate-350">
                  You scored <strong className="text-primary-600 font-bold">{quizScore} / {quizQuestions.length}</strong> correct answers!
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl text-xs inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  🏆 Reward: +30 XP credited to your profile!
                </div>
                <div>
                  <button
                    onClick={() => { setQuizActive(false); setQuizNotes(''); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl px-5 py-2.5 text-xs transition-colors"
                  >
                    Start New Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Question view */}
                <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-850">
                  <span className="text-[10px] text-primary-600 font-bold bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded uppercase">Question {quizIdx + 1} of {quizQuestions.length}</span>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mt-3 leading-relaxed">{quizQuestions[quizIdx].question}</h4>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizQuestions[quizIdx].options.map((opt: string) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === quizQuestions[quizIdx].answer;
                    const showFeedback = selectedOption !== '';
                    return (
                      <button
                        key={opt}
                        onClick={() => !showFeedback && handleAnswerQuiz(opt)}
                        className={`p-4 rounded-xl border text-xs text-left transition-all ${
                          showFeedback
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20'
                              : isSelected
                              ? 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20'
                              : 'bg-white dark:bg-slate-900 border-gray-100'
                            : isSelected
                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'bg-white dark:bg-slate-900 border-gray-150 hover:border-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== '' && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl text-xs leading-relaxed text-amber-700">
                    <strong>Explanation:</strong> {quizQuestions[quizIdx].explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resume Tab */}
        {tab === 'resume' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">AI Resume & Profile Builder</h3>
              <p className="text-xs text-gray-400 mt-1">Generate corporate formatted resumes and ready-to-use LinkedIn announcements.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Role</label>
                  <input
                    value={resumeRole}
                    onChange={e => setResumeRole(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Technical Skills</label>
                  <textarea
                    value={resumeSkills}
                    onChange={e => setResumeSkills(e.target.value)}
                    className="input-field h-16 resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Projects</label>
                  <textarea
                    value={resumeProjects}
                    onChange={e => setResumeProjects(e.target.value)}
                    className="input-field h-16 resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Work Experience</label>
                  <textarea
                    value={resumeExp}
                    onChange={e => setResumeExp(e.target.value)}
                    className="input-field h-16 resize-none text-xs"
                  />
                </div>
                <button
                  onClick={handleGenerateResume}
                  disabled={resumeLoading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  {resumeLoading ? 'Compiling resume...' : 'Generate Resume'}
                </button>
              </div>

              {/* Preview */}
              <div className="md:col-span-2 space-y-4">
                {resumeResult ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume Preview</h4>
                      <pre className="bg-gray-50 dark:bg-slate-950 p-5 rounded-2xl border border-gray-155 dark:border-slate-800 text-xs font-mono leading-6 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {resumeResult}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn Post Announcement</h4>
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl text-xs text-blue-900 dark:text-blue-300 font-mono leading-relaxed">
                        {linkedinPost}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-150 dark:border-slate-800 rounded-2xl h-full min-h-[220px] flex items-center justify-center text-gray-400 text-xs">
                    Fill information and click "Generate" to preview AI outcomes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracker Tab */}
        {tab === 'tracker' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Kanban Application Tracker</h3>
                <p className="text-xs text-gray-400 mt-1">Manage corporate applications and status boards manually.</p>
              </div>
            </div>

            {/* Quick add form */}
            <form onSubmit={handleAddTrackerJob} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-850">
              <input
                value={newTrackerCompany}
                onChange={e => setNewTrackerCompany(e.target.value)}
                placeholder="Company Name"
                className="input-field text-xs bg-white dark:bg-slate-900"
                required
              />
              <input
                value={newTrackerRole}
                onChange={e => setNewTrackerRole(e.target.value)}
                placeholder="Role / Title"
                className="input-field text-xs bg-white dark:bg-slate-900"
                required
              />
              <select
                value={newTrackerStatus}
                onChange={e => setNewTrackerStatus(e.target.value)}
                className="input-field text-xs cursor-pointer bg-white dark:bg-slate-900"
              >
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs"
              >
                Add Application
              </button>
            </form>

            {/* Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'].map(col => {
                const colJobs = trackerJobs.filter(j => j.status === col);
                return (
                  <div key={col} className="bg-gray-50 dark:bg-slate-950/55 rounded-2xl p-4 border border-gray-100 dark:border-slate-850 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{col}</span>
                      <span className="bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{colJobs.length}</span>
                    </div>

                    <div className="space-y-3 flex-grow">
                      {colJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-3 rounded-xl shadow-sm space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white text-xs">{job.role}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{job.company}</p>
                          
                          {/* Movements */}
                          <div className="flex justify-between items-center pt-2 text-[9px]">
                            <button
                              onClick={() => handleDeleteTrackerJob(job.id)}
                              className="text-rose-500 hover:underline"
                            >
                              Delete
                            </button>
                            <div className="flex gap-1.5">
                              {col !== 'Applied' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cols = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
                                    const prevIdx = cols.indexOf(col) - 1;
                                    handleMoveTrackerJob(job.id, cols[prevIdx]);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  ←
                                </button>
                              )}
                              {col !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cols = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
                                    const nextIdx = cols.indexOf(col) + 1;
                                    handleMoveTrackerJob(job.id, cols[nextIdx]);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Notes Tab */}
        {tab === 'videoNotes' && (
          <div className="bg-white border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Timestamped Video Lecture Notes</h3>
                <p className="text-xs text-gray-400 mt-1">Take quick review notes synced to timestamps of enrolled course videos.</p>
              </div>
              <button
                onClick={handleExportVideoNotes}
                className="bg-gray-150 hover:bg-gray-250 text-gray-700 font-bold rounded-xl px-4 py-2.5 text-xs transition-colors"
              >
                Export Notes (.txt)
              </button>
            </div>

            {/* Note form */}
            <form onSubmit={handleAddVideoNote} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-850">
              <select
                value={selectedNoteCourseId}
                onChange={e => setSelectedNoteCourseId(e.target.value)}
                className="input-field text-xs cursor-pointer bg-white dark:bg-slate-900"
              >
                {enrollments.map(e => {
                  const c = getCourse(e.course_id);
                  return <option key={e.id} value={e.course_id}>{c?.title || `Course #${e.course_id}`}</option>;
                })}
              </select>
              <input
                value={videoNoteTime}
                onChange={e => setVideoNoteTime(e.target.value)}
                placeholder="Timestamp (e.g. 05:40)"
                className="input-field text-xs text-center bg-white dark:bg-slate-900"
                required
              />
              <input
                value={videoNoteText}
                onChange={e => setVideoNoteText(e.target.value)}
                placeholder="Note content..."
                className="input-field text-xs sm:col-span-2 bg-white dark:bg-slate-900"
                required
              />
              <div className="sm:col-span-4 flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Notes Display list */}
            <div className="space-y-3">
              {savedNotes.filter(n => n.courseId === selectedNoteCourseId).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-gray-200">
                  No notes saved for this course yet.
                </p>
              ) : (
                savedNotes.filter(n => n.courseId === selectedNoteCourseId).map(n => (
                  <div key={n.id} className="bg-gray-50 dark:bg-slate-950/45 p-4 rounded-2xl border border-gray-100 dark:border-slate-850 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-extrabold px-3 py-1 rounded-lg">
                        {n.time}
                      </span>
                      <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-mono">{n.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideoNote(n.id)}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-6">
          {/* ── Badges & Achievement Wall (Feature 17) ───────────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Badges & Achievements
            </h3>
            <p className="text-gray-400 text-xs mb-5">Complete challenges to unlock exclusive badges and show off your skills!</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {BADGE_DEFS.map(badge => {
                const unlocked = badge.check(badgeData);
                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      unlocked
                        ? `border-transparent shadow-lg bg-gradient-to-br ${badge.color}`
                        : 'border-gray-100 bg-gray-50 grayscale opacity-60'
                    }`}
                    title={badge.description}
                  >
                    {!unlocked && (
                      <div className="absolute top-2 right-2">
                        <Lock size={10} className="text-gray-400" />
                      </div>
                    )}
                    <span className={`text-3xl leading-none ${unlocked ? '' : 'filter grayscale'}`}>{badge.icon}</span>
                    <div className="text-center">
                      <p className={`text-xs font-bold leading-tight ${ unlocked ? 'text-white' : 'text-gray-500'}`}>{badge.name}</p>
                      <p className={`text-[10px] mt-0.5 leading-snug ${ unlocked ? 'text-white/80' : 'text-gray-400'}`}>{badge.description}</p>
                    </div>
                    {unlocked && (
                      <span className="absolute top-2 left-2 w-4 h-4 bg-white/25 rounded-full flex items-center justify-center">
                        <CheckCircle size={10} className="text-white" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar Chart & Contribution Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Radar Chart */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">🛡️ Skill Radar Metrics</h3>
                <p className="text-gray-400 text-xs mb-4">Calculated from course completions and experience coefficients.</p>
              </div>
              <div className="flex justify-center py-4">
                {/* Hexagonal Radar SVG */}
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
                  {/* Axis grids */}
                  <polygon points="110,20 188,65 188,155 110,200 32,155 32,65" fill="none" stroke="#f1f5f9" strokeWidth="2" />
                  <polygon points="110,50 168,83 168,137 110,170 52,137 52,83" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
                  <polygon points="110,80 148,102 148,118 110,140 72,118 72,102" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Axis lines */}
                  <line x1="110" y1="110" x2="110" y2="20" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="110" y1="110" x2="188" y2="65" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="110" y1="110" x2="188" y2="155" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="110" y1="110" x2="110" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="110" y1="110" x2="32" y2="155" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="110" y1="110" x2="32" y2="65" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Labels */}
                  <text x="110" y="12" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Python</text>
                  <text x="202" y="65" textAnchor="start" className="text-[10px] font-bold fill-slate-500">Web Dev</text>
                  <text x="202" y="160" textAnchor="start" className="text-[10px] font-bold fill-slate-500">Databases</text>
                  <text x="110" y="214" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">Tools</text>
                  <text x="18" y="160" textAnchor="end" className="text-[10px] font-bold fill-slate-500">Soft Skills</text>
                  <text x="18" y="65" textAnchor="end" className="text-[10px] font-bold fill-slate-500">Projects</text>

                  {/* Skills polygon data */}
                  <polygon
                    points="110,40 170,75 160,130 110,150 70,135 60,80"
                    fill="rgba(124,58,237,0.25)"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>

            {/* Contribution Heatmap */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">🔥 Study Activity Log</h3>
                <p className="text-gray-400 text-xs mb-4">Your daily login and challenge contributions over last 24 weeks.</p>
              </div>
              
              <div className="overflow-x-auto py-2">
                <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
                  {Array.from({ length: 168 }).map((_, idx) => {
                    const intensity = idx % 9 === 0 ? 'bg-green-600' : idx % 6 === 0 ? 'bg-green-400' : idx % 4 === 0 ? 'bg-green-200' : 'bg-gray-100 dark:bg-slate-800';
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-sm ${intensity} hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer`}
                        title={`Day ${idx}: Contribution registered`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 border-t border-gray-50 pt-3">
                <span>Streak: <strong>{streak} Days</strong></span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />
                  <div className="w-2.5 h-2.5 bg-green-200 rounded-sm" />
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-sm" />
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-sm" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-5">Edit Profile</h3>
              {profileSaved && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-green-700 text-sm">Profile updated successfully!</span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input value={user?.email || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="input-field" placeholder="+91 XXXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Github size={16} className="text-gray-500" /> GitHub Username
                  </label>
                  <input value={profileForm.github_username} onChange={e => setProfileForm(p => ({ ...p, github_username: e.target.value }))}
                    className="input-field" placeholder="e.g. vaibhavtambe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
                  <input value={studentProfile?.student_id || ''} disabled className="input-field bg-gray-50 text-primary-600 font-mono cursor-not-allowed" />
                </div>
                <button onClick={saveProfile} disabled={savingProfile}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                  {savingProfile ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : null}
                  Save Changes
                </button>
              </div>
            </div>

            {/* GitHub Portfolio Section */}
            <div className="card p-6 mt-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Github size={20} className="text-slate-800" />
                GitHub Portfolio Integration
              </h3>
              <p className="text-gray-500 text-xs mb-5">
                Latest 4 public repositories fetched in real-time from your GitHub account.
              </p>

              {loadingRepos ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                  <span className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Fetching repository cards...</span>
                </div>
              ) : repoError ? (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 p-3 rounded-xl">{repoError}</p>
              ) : repos.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No public repositories loaded. Enter a valid GitHub username above and save.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repos.map(repo => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-100 rounded-xl p-4 hover:border-primary-400 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col justify-between gap-3 holo-shimmer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-gray-800 text-sm truncate">{repo.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            ★ {repo.stargazers_count}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                          {repo.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-2.5 h-2.5 bg-primary-500 rounded-full"></span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{repo.language || 'HTML/JS'}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* ── Feature 38: Onboarding Wizard Modal ────────────────────── */}
      {showOnboarding && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'linear-gradient(135deg,rgba(15,12,41,0.95) 0%,rgba(48,43,99,0.97) 60%,rgba(36,36,62,0.98) 100%)', backdropFilter: 'blur(8px)' }}
        >
          <div className="w-full max-w-lg relative">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3].map(s => (
                <div key={s} className={`h-2 rounded-full transition-all duration-300 ${
                  s === onboardStep ? 'w-8 bg-purple-400' : s < onboardStep ? 'w-2 bg-purple-600' : 'w-2 bg-white/20'
                }`} />
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl border border-white/10 p-8 shadow-2xl">
              {/* Step 1: Welcome */}
              {onboardStep === 1 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    🎓
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome, {studentProfile?.full_name?.split(' ')[0] || 'Learner'}!
                  </h2>
                  <p className="text-purple-200 text-sm leading-relaxed mb-6">
                    You've joined TeKVora Infotech — where you'll master real-world tech skills, earn certificates, build projects, and launch your career. Let's set you up for success in 2 quick steps!
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                    {[
                      { icon: '💻', title: 'Real Courses', desc: 'Learn from industry experts' },
                      { icon: '🏆', title: 'Earn XP & Badges', desc: 'Gamified learning journey' },
                      { icon: '📜', title: 'Certificates', desc: 'Industry-recognized credentials' },
                      { icon: '🤖', title: 'AI Tutor', desc: 'Get help 24/7 from AI' },
                    ].map(f => (
                      <div key={f.title} className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                        <span className="text-xl">{f.icon}</span>
                        <div><p className="text-white text-xs font-semibold">{f.title}</p><p className="text-white/50 text-[10px]">{f.desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setOnboardStep(2)}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                  >
                    Let's Go! →
                  </button>
                </div>
              )}

              {/* Step 2: Set Goal */}
              {onboardStep === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 text-center">What's your learning goal?</h2>
                  <p className="text-purple-200 text-sm text-center mb-6">We'll personalise your experience based on your goal.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {GOALS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setOnboardGoal(g.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                          onboardGoal === g.id
                            ? 'border-purple-400 bg-purple-900/40 shadow-lg shadow-purple-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-3xl">{g.icon}</span>
                        <span className="text-white text-xs font-semibold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setOnboardStep(1)} className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors">
                      Back
                    </button>
                    <button
                      onClick={() => setOnboardStep(3)}
                      disabled={!onboardGoal}
                      className="flex-2 flex-[2] py-3 rounded-xl font-bold text-white transition-all hover:scale-105 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: GitHub + Skill Level */}
              {onboardStep === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 text-center">Almost there!</h2>
                  <p className="text-purple-200 text-sm text-center mb-6">Connect GitHub and set your skill level so we can track your growth.</p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-white/70 text-xs font-semibold mb-2">GitHub Username (optional)</label>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-purple-400 transition-colors">
                        <Github size={16} className="text-gray-400" />
                        <input
                          value={onboardGithub}
                          onChange={e => setOnboardGithub(e.target.value)}
                          placeholder="e.g. vaibhavtambe"
                          className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-xs font-semibold mb-2">Your Current Skill Level</label>
                      <div className="flex gap-3">
                        {SKILL_LEVELS.map(level => (
                          <button
                            key={level}
                            onClick={() => setOnboardSkill(level)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                              onboardSkill === level
                                ? 'border-purple-400 bg-purple-900/40 text-white'
                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setOnboardStep(2)} className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors">
                      Back
                    </button>
                    <button
                      onClick={completeOnboarding}
                      className="flex-[2] py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                    >
                      🎉 Complete Setup!
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}
