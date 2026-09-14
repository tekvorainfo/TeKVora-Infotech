import { Globe, Smartphone, Palette, TrendingUp, Cloud, Cpu, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from '../lib/router';
import Layout from '../components/Layout';

const services = [
  {
    icon: Globe,
    title: 'Web Development',
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    desc: 'End-to-end web development solutions using modern frameworks. From static websites to complex web applications with Django, React, and more.',
    features: ['Responsive Design', 'Full Stack Development', 'REST APIs', 'Database Design', 'CMS Integration', 'Performance Optimization'],
  },
  {
    icon: Smartphone,
    title: 'Mobile App Development',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    desc: 'Cross-platform mobile applications using Flutter and Dart. Deploy to both iOS and Android with a single codebase and Firebase backend.',
    features: ['Flutter Development', 'iOS & Android', 'Firebase Integration', 'Push Notifications', 'Offline Support', 'App Store Deployment'],
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    desc: 'User-centered design that converts. Beautiful interfaces crafted in Figma with thorough user research and usability testing.',
    features: ['Figma Prototypes', 'User Research', 'Wireframing', 'Design Systems', 'Usability Testing', 'Brand Identity'],
  },
  {
    icon: TrendingUp,
    title: 'Digital Marketing',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    desc: 'Data-driven digital marketing strategies to grow your brand online. SEO, social media management, and targeted ad campaigns.',
    features: ['SEO Optimization', 'Social Media Marketing', 'Google Ads', 'Content Strategy', 'Analytics & Reporting', 'Email Marketing'],
  },
  {
    icon: Cloud,
    title: 'Cloud Solutions',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    desc: 'Scalable cloud infrastructure and deployment solutions. Migrate to the cloud or optimize your existing cloud setup for performance and cost.',
    features: ['AWS / GCP Deployment', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Auto Scaling', 'Cloud Security', 'Cost Optimization'],
  },
  {
    icon: Cpu,
    title: 'AI & ML Solutions',
    color: 'from-violet-500 to-purple-700',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    desc: 'Intelligent automation and AI-powered solutions tailored to your business needs. From chatbots to predictive analytics and custom ML models.',
    features: ['Custom ML Models', 'NLP & Chatbots', 'Predictive Analytics', 'Computer Vision', 'Data Pipeline', 'Model Deployment'],
  },
];

export default function Services() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-primary-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              Innovating Digital Solutions
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our IT Services</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Comprehensive technology solutions to help your business grow in the digital era.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div key={i} className="card p-8 group" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{service.desc}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className={service.textColor} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20need%20help%20with%20your%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${service.textColor} hover:underline`}
                >
                  Get a Quote <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center" data-aos="fade-up">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Start Your Project?</h2>
          <p className="text-blue-100 mb-8">Contact us today and let's build something amazing together.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20discuss%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary-600 hover:bg-gray-50 px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <i className="fab fa-whatsapp text-green-500 text-lg"></i>
              WhatsApp Us
            </a>
            <Link to="/contact" className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all">
              Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
