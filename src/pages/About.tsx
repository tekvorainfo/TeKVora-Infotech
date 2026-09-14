import { Target, Eye, Heart, Shield, Award, Users, BookOpen } from 'lucide-react';
import { Link } from '../lib/router';
import Layout from '../components/Layout';

const values = [
  { icon: Target, title: 'Mission', desc: 'To empower students and professionals with industry-relevant IT skills through structured programs, expert mentorship, and verifiable credentials.' },
  { icon: Eye, title: 'Vision', desc: 'To become the most trusted IT education and internship platform in Maharashtra, recognized by every college and employer.' },
  { icon: Heart, title: 'Values', desc: 'Transparency, excellence, student-first approach, industry alignment, and building lasting careers — not just certificates.' },
];

const milestones = [
  { year: '2024', event: 'First batch of students enrolled in Full Stack Web Development course.' },
  { year: '2024', event: 'Launched structured internship programs with verifiable digital certificates.' },
  { year: '2025', event: 'Signed first college MOU partnership for student skill development.' },
  { year: '2025', event: 'Expanded to 8 courses, 5 internship programs, and 15+ college partnerships.' },
  { year: '2026', event: 'Launched daily attendance tracking, advanced task management, and corporate-style intern portal.' },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About TeKVora Infotech</h1>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Innovating Digital Solutions — bridging the gap between education and industry.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <span className="badge-orange mb-3 inline-block">Our Story</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Building the Next Generation of Tech Professionals</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                TeKVora Infotech was founded by Mr. Vaibhav Tambe with a single goal: to make quality IT education accessible and industry-aligned for students across Maharashtra. Recognizing the gap between college curricula and industry requirements, TeKVora was built to fill that gap.
              </p>
              <p className="text-gray-500 leading-relaxed mb-6">
                Starting from Chhatrapati Sambhajinagar, we have grown to serve students from across the region with structured courses, hands-on internships, and a complete credentialing system that employers trust.
              </p>
              <div className="flex gap-3">
                <Link to="/courses" className="btn-primary text-sm">Explore Courses</Link>
                <Link to="/mou" className="btn-outline text-sm">College Partnerships</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
              {[
                { icon: Users, label: '500+ Students', color: 'bg-primary-50 text-primary-600' },
                { icon: Award, label: '200+ Certificates', color: 'bg-orange-50 text-orange-600' },
                { icon: BookOpen, label: '5+ Courses', color: 'bg-green-50 text-green-600' },
                { icon: Shield, label: 'MOU Backed', color: 'bg-purple-50 text-purple-600' },
              ].map((item, i) => (
                <div key={i} className={`${item.color} rounded-2xl p-6 flex flex-col items-center text-center`}>
                  <item.icon size={28} className="mb-2" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="card p-8 text-center" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-5 mx-auto">
                  <v.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12" data-aos="fade-up">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 mb-8 relative" data-aos="fade-left" data-aos-delay={i * 80}>
                <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm z-10 shadow-md">
                  {m.year}
                </div>
                <div className="card p-5 flex-grow">
                  <p className="text-gray-700 text-sm leading-relaxed">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center" data-aos="fade-up">
          <h2 className="text-3xl font-bold text-white mb-3">Join Our Growing Community</h2>
          <p className="text-blue-100 mb-8">Thousands of students trust TeKVora. Start your journey today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/courses" className="bg-white text-primary-600 hover:bg-gray-50 px-7 py-3.5 rounded-xl font-semibold transition-all">
              Start Learning
            </Link>
            <Link to="/internships" className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all">
              Apply for Internship
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
