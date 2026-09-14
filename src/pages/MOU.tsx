import { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { MouPartner } from '../lib/types';
import { mouRequestSchema } from '../lib/validation';
import { z } from 'zod';

const benefits = [
  'Structured internship programs tailored to college curriculum',
  'Industry-relevant short-term courses for students',
  'Verifiable digital certificates with QR codes',
  'Guest lectures & workshops by industry experts',
  'Dedicated placement support for students',
  'Regular progress reports for college administration',
];

const studentBenefits = [
  { icon: '🏆', title: 'Verifiable Certificate', desc: 'Industry-recognized certificate with QR code verification.' },
  { icon: '💼', title: 'Real Project Experience', desc: 'Work on actual client projects during your internship.' },
  { icon: '👨‍💻', title: 'Expert Mentorship', desc: 'Direct mentorship from Mr. Vaibhav Tambe and team.' },
  { icon: '📈', title: 'Career Support', desc: 'Resume review, interview prep, and job referrals.' },
];

const processSteps = [
  { step: 1, title: 'Initial Discussion', desc: 'Connect with our team via WhatsApp or the form below.' },
  { step: 2, title: 'Proposal Shared', desc: 'We share a detailed MOU proposal and program structure.' },
  { step: 3, title: 'MOU Drafting', desc: 'Legal MOU document drafted with mutually agreed terms.' },
  { step: 4, title: 'Signing Ceremony', desc: 'Official MOU signing with college administration.' },
  { step: 5, title: 'Program Launch', desc: 'Launch courses and internships for students immediately.' },
];

export default function MOU() {
  const [partners, setPartners] = useState<MouPartner[]>([]);
  const [form, setForm] = useState({ college_name: '', contact_person: '', designation: '', email: '', phone: '', city: '', student_count: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('mou_partners').select('*').eq('is_active', true)
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Failed to fetch MOU partners from Supabase:', error);
          return;
        }
        if (data) setPartners(data as MouPartner[]);
      })
      .catch((err: any) => {
        console.error('Error fetching MOU partners:', err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validatedData = mouRequestSchema.parse(form);
      const { error: err } = await supabase.from('mou_requests').insert({ ...validatedData, status: 'new' });
      if (err) setError('Failed to submit. Please try WhatsApp instead.');
      else setSuccess(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-500/10 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              🤝 College Partnerships
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Partner with TeKVora Infotech —<br />
              <span className="text-orange-400">Empower Your Students</span>
            </h1>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">
              Build a formal MOU partnership and give your students access to industry-aligned courses, real internships, and verified certificates.
            </p>
            <a
              href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20discuss%20an%20MOU%20partnership%20for%20our%20college."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold text-lg transition-all"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Request MOU Discussion
            </a>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <span className="badge-blue mb-3 inline-block">For Partner Colleges</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">What We Offer to Partner Colleges</h2>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <a href="#mou-form" className="btn-primary text-sm">
                  Submit MOU Request <ArrowRight size={16} />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
              {studentBenefits.map((b, i) => (
                <div key={i} className="card p-5">
                  <div className="text-3xl mb-3">{b.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{b.title}</h3>
                  <p className="text-gray-500 text-xs">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-gray-900">MOU Process Timeline</h2>
            <p className="text-gray-500 mt-2">Simple, transparent, and fast — from discussion to launch.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {processSteps.map((step, i) => (
                <div key={i} className="text-center relative" data-aos="fade-up" data-aos-delay={i * 80}>
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 relative z-10 shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h3>
                  <p className="text-gray-500 text-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Our Partner Colleges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {partners.map((p) => (
                <div key={p.id} className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary-600 font-bold text-lg">{p.college_name.charAt(0)}</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{p.college_name}</p>
                  {p.city && <p className="text-gray-400 text-xs mt-1">{p.city}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MOU Form */}
      <section id="mou-form" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-gray-900">Submit MOU Request</h2>
            <p className="text-gray-500 mt-2">Fill out the form and we'll contact you within 24 hours.</p>
          </div>
          <div className="card p-8" data-aos="fade-up">
            {success ? (
              <div className="text-center py-10">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 mb-2">Request Submitted!</h4>
                <p className="text-gray-500 text-sm">We'll contact you within 24 hours to discuss the MOU.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">College Name *</label>
                    <input required value={form.college_name} onChange={e => setForm(p => ({...p, college_name: e.target.value}))}
                      className="input-field" placeholder="Enter college/university name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <input required value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))}
                      className="input-field" placeholder="City" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person *</label>
                    <input required value={form.contact_person} onChange={e => setForm(p => ({...p, contact_person: e.target.value}))}
                      className="input-field" placeholder="Principal / HOD / TPO name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation *</label>
                    <input required value={form.designation} onChange={e => setForm(p => ({...p, designation: e.target.value}))}
                      className="input-field" placeholder="e.g. Principal, TPO" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                      className="input-field" placeholder="official@college.edu" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                    <input required value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                      className="input-field" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Approximate No. of Students</label>
                  <input value={form.student_count} onChange={e => setForm(p => ({...p, student_count: e.target.value}))}
                    className="input-field" placeholder="e.g. 200-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message / Requirements</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                    rows={4} className="input-field resize-none" placeholder="Tell us about your requirements and expectations..." />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Submitting...</> : 'Submit MOU Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
