import { useState } from 'react';
import Layout from '../components/Layout';
import { ShieldCheck, Mail, Send, CheckCircle2, Building, HelpCircle, Users } from 'lucide-react';
import { triggerConfetti } from '../lib/confetti';

const PARTNERS = ['TCS', 'Cognizant', 'Capgemini', 'InnovaTech', 'Veloce Digital', 'Apex Labs'];

export default function Recruiters() {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !contact || !email) return;

    // Simulate saving recruitment inquiry to Supabase
    setSubmitted(true);
    triggerConfetti();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 font-poppins">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="badge-blue flex items-center gap-1.5 w-fit mx-auto">
            <Building size={14} /> Hire Talent
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
            Company Hiring Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm">
            Partner with TeKVora Infotech to hire industry-ready, pre-vetted students with verified project portfolios.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Verified Engineers', value: '350+ Students', desc: 'React, Python, Django, Databases' },
            { label: 'Vetted Portfolios', value: '100% Projects', desc: 'Source code verified on GitHub' },
            { label: 'ISO Certificate Verification', value: 'Secure Verification', desc: 'Secure QR scanners for companies' }
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{s.label}</span>
              <strong className="text-lg font-black text-primary-600 mt-1 block">{s.value}</strong>
              <p className="text-[10px] text-gray-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-8 text-center space-y-4">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Inquiry Submitted!</h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 max-w-xs mx-auto">
              Our training and placement officer will contact you within 24 hours to match candidate profiles.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 py-2.5 text-xs transition-all"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Form */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary-600" /> Share Requirements
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      required
                      placeholder="e.g. Apex Inc"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                    <input
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      required
                      placeholder="e.g. Sneha Roy"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Work Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="e.g. hr@company.com"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Target Roles</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Python backend, React frontend"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Requirements / Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Specify tech stack requirements, package ranges, location specifications..."
                    className="input-field h-28 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/10 flex items-center justify-center gap-1.5"
                >
                  <Send size={12} fill="white" /> Submit Inquiry
                </button>
              </form>
            </div>

            {/* Partners lists */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Hiring Network</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">Our graduates are placed and currently working with corporate partners across Pune, Bangalore, and Mumbai.</p>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                {PARTNERS.map(p => (
                  <div key={p} className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-850 py-3 text-center rounded-xl font-bold font-mono text-[10px] text-gray-500 dark:text-slate-300 select-none">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
