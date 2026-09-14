import { Link } from '../lib/router';
import { useI18n } from '../contexts/I18nContext';
import { MapPin, Phone, Mail } from 'lucide-react';

const quickLinks = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'about', label: 'About Us', path: '/about' },
  { key: 'courses', label: 'Courses', path: '/courses' },
  { key: 'internships', label: 'Internships', path: '/internships' },
  { key: 'faculty', label: 'Faculty', path: '/faculty' },
  { key: 'mou', label: 'MOU / Partnerships', path: '/mou' },
  { key: 'verify', label: 'Verify Certificate', path: '/verify' },
  { key: 'contact', label: 'Contact Us', path: '/contact' },
] as const;

const services = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Digital Marketing',
  'Cloud Solutions',
  'AI & ML Solutions',
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-navy-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <img src="/new_logo.png" alt="TeKVora Infotech" className="h-14 w-auto mb-4 bg-white rounded-xl p-2" />
            <p className="text-sm text-gray-400 leading-relaxed mt-4">
              {t('tagline')}
            </p>
            <div className="flex gap-4 mt-6">
              {[
                { icon: 'fab fa-linkedin', href: '#' }, // TODO: Add real LinkedIn URL
                { icon: 'fab fa-instagram', href: '#' }, // TODO: Add real Instagram URL
                { icon: 'fab fa-youtube', href: '#' }, // TODO: Add real YouTube URL
                { icon: 'fab fa-twitter', href: '#' }, // TODO: Add real Twitter URL
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all duration-200"
                >
                  <i className={`${s.icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                     to={link.path}
                     className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1.5"
                   >
                     <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0"></span>
                     {t(link.key)}
                   </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* IT Services */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">IT Services</h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 bg-primary-500 rounded-full flex-shrink-0"></span>
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">
                  Sambhaji Residency, Phase 3, Gat No. 12,<br />
                  Row House No. 11/18, Behind Devgiri Bank,<br />
                  Paithan Road, Chh. Sambhajinagar, MH
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-orange-400 flex-shrink-0" />
                <a href="tel:+919022302322" className="text-sm text-gray-400 hover:text-white transition-colors">
                  +91 9022302322
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-orange-400 flex-shrink-0" />
                <a href="mailto:info@tekvora.com" className="text-sm text-gray-400 hover:text-white transition-colors">
                  info@tekvora.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fab fa-whatsapp text-green-400 text-base flex-shrink-0"></i>
                <a
                  href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20know%20more."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            © 2026 TeKVora Infotech. All rights reserved. | MSME: UDYAM-MH-12345678 | GST: 27AAPFT1234A1Z5
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Privacy</Link>
            <Link to="/refund" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Refund</Link>
            <a href="/tekvora-admin-access" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
