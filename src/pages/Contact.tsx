import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { contactFormSchema } from '../lib/validation';
import { sendEmail, contactConfirmationHtml, adminContactNotificationHtml } from '../lib/emailService';
import { z } from 'zod';

export default function Contact() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const validatedData = contactFormSchema.parse(form);
      const { error: err } = await supabase.from('contact_submissions').insert(validatedData);
      
      if (err) {
        setError('Failed to send message. Please try WhatsApp instead.');
      } else {
        setSuccess(true);
        // Send confirmation email to user and notification to admin (fire-and-forget)
        sendEmail(
          form.email,
          'We received your message — TeKVora Infotech',
          contactConfirmationHtml(form.full_name)
        );
        sendEmail(
          'info@tekvora.com',
          `New Contact: ${form.full_name} — ${form.subject || 'No Subject'}`,
          adminContactNotificationHtml(form.full_name, form.email, form.phone, form.subject, form.message)
        );
      }
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
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div data-aos="fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Have questions? We'd love to hear from you. Reach out via form, phone, or WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div data-aos="fade-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
              <p className="text-gray-500 mb-8">We're here to help with courses, internships, MOU inquiries, and IT services.</p>

              <div className="space-y-5 mb-10">
                {[
                  { icon: MapPin, label: 'Address', value: 'Sambhaji Residency, Phase 3, Gat No. 12, Row House No. 11/18, Behind Devgiri Bank, Paithan Road, Chh. Sambhajinagar, MH', color: 'text-primary-600 bg-primary-50' },
                  { icon: Phone, label: 'Phone', value: '+91 9022302322', color: 'text-orange-600 bg-orange-50' },
                  { icon: Mail, label: 'Email', value: 'info@tekvora.com', color: 'text-green-600 bg-green-50' },
                  { icon: Clock, label: 'Hours', value: 'Mon–Sat: 9 AM – 7 PM IST', color: 'text-purple-600 bg-purple-50' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                      <p className="text-gray-700 font-medium mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-green-500 text-xl"></i>
                  Fastest Response via WhatsApp
                </p>
                <p className="text-gray-500 text-sm mb-4">Click below to chat directly with our team.</p>
                <a
                  href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20know%20more."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Form */}
            <div data-aos="fade-left">
              <div className="card p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h3>

                {success ? (
                  <div className="text-center py-10">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">Message Sent!</h4>
                    <p className="text-gray-500 text-sm">We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-500 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input required value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))}
                          className="input-field" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                          className="input-field" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                        <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                          className="input-field" placeholder="+91 XXXXXXXXXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                        <input value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))}
                          className="input-field" placeholder="e.g. Course Inquiry" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea required value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                        rows={5} className="input-field resize-none" placeholder="How can we help you?" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                      {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Sending...</> : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
