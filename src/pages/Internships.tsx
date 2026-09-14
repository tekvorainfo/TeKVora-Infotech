import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { Briefcase, Clock, CheckCircle, ArrowRight, Award, Users, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Internship } from '../lib/types';

const staticInternships: Internship[] = [
  { id: '1', title: 'Web Development Internship', slug: 'web-development-internship', description: 'Gain hands-on experience building real web applications. Work on live projects using HTML, CSS, JavaScript, and Django under expert mentorship from our founder.', duration: '1 Month', mode: 'Remote/Hybrid', certificate: true, skills: ['HTML', 'CSS', 'JavaScript', 'Django', 'Git'], status: 'active', created_at: '' },
  { id: '2', title: 'Python & Data Science Internship', slug: 'python-data-science-internship', description: 'Work on real data science projects, analyze complex datasets, and build machine learning models. Get hands-on experience with industry-standard Python libraries.', duration: '1 Month', mode: 'Remote', certificate: true, skills: ['Python', 'Pandas', 'NumPy', 'ML', 'Jupyter'], status: 'active', created_at: '' },
  { id: '3', title: 'UI/UX Design Internship', slug: 'ui-ux-design-internship', description: 'Design beautiful user interfaces and experiences for real client projects. Learn design thinking, prototyping, and usability testing under expert guidance.', duration: '1 Month', mode: 'Remote/Hybrid', certificate: true, skills: ['Figma', 'UI Design', 'Prototyping', 'Research'], status: 'active', created_at: '' },
  { id: '4', title: 'React.js Development Internship', slug: 'react-development-internship', description: 'Build modern single-page applications with React.js. Learn components, hooks, state management, and API integration working on real projects.', duration: '1 Month', mode: 'Remote', certificate: true, skills: ['React', 'JSX', 'Hooks', 'Redux', 'APIs'], status: 'active', created_at: '' },
  { id: '5', title: 'Mobile App Development Internship', slug: 'mobile-development-internship', description: 'Create cross-platform mobile apps with Flutter and Dart. Build, test, and deploy apps to both iOS and Android platforms.', duration: '1 Month', mode: 'Remote/Hybrid', certificate: true, skills: ['Flutter', 'Dart', 'Firebase', 'UI Design'], status: 'active', created_at: '' },
  { id: '6', title: 'Cloud & DevOps Internship', slug: 'cloud-devops-internship', description: 'Learn cloud infrastructure, CI/CD pipelines, containerization with Docker, and orchestration with Kubernetes. Deploy applications on AWS.', duration: '1 Month', mode: 'Remote', certificate: true, skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'], status: 'active', created_at: '' },
  { id: '7', title: 'Node.js Backend Internship', slug: 'nodejs-backend-internship', description: 'Master backend development with Node.js and Express. Build RESTful APIs, handle databases, and implement authentication systems.', duration: '1 Month', mode: 'Remote', certificate: true, skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JWT'], status: 'active', created_at: '' },
  { id: '8', title: 'Digital Marketing Internship', slug: 'digital-marketing-internship', description: 'Learn SEO, social media marketing, Google Ads, and content strategy. Work on real marketing campaigns and analyze performance metrics.', duration: '1 Month', mode: 'Remote/Hybrid', certificate: true, skills: ['SEO', 'Google Ads', 'Social Media', 'Analytics', 'Content'], status: 'active', created_at: '' },
];

const pipeline = [
  { step: 1, title: 'Apply Online', desc: 'Fill the application form — no login needed.' },
  { step: 2, title: 'Application Review', desc: 'Our team reviews your application within 3 days.' },
  { step: 3, title: 'Interview', desc: 'Online or in-person interview with our team.' },
  { step: 4, title: 'Offer Letter', desc: 'Receive your official offer letter via email.' },
  { step: 5, title: 'Join & Work', desc: 'Get your Intern ID and start working on projects.' },
  { step: 6, title: 'Certificate', desc: 'Receive a verifiable digital certificate on completion.' },
];

const stats = [
  { icon: Users, value: '100+', label: 'Interns Trained' },
  { icon: Award, value: '8+', label: 'Programs Available' },
  { icon: CheckCircle, value: '95%', label: 'Completion Rate' },
  { icon: TrendingUp, value: '80%', label: 'Placement Rate' },
];

export default function Internships() {
  const [internships, setInternships] = useState<Internship[]>(staticInternships);

  useEffect(() => {
    supabase.from('internships').select('*').eq('status', 'active')
      .then(({ data, error }: { data: any; error: any }) => {
         if (error) {
           console.error('Failed to fetch internships from Supabase:', error);
           return;
         }
         if (data && data.length > 0) setInternships(data as Internship[]);
      })
      .catch((err: any) => {
        console.error('Error fetching internships:', err);
      });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/10 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/30">
              <Briefcase size={16} /> Real-World Experience
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Internship Programs</h1>
            <p className="text-orange-100 text-lg max-w-2xl mx-auto">
              1-month structured internships with real projects, expert mentorship, daily attendance tracking, and verifiable certificates.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center" data-aos="fade-up" data-aos-delay={i * 80}>
                <stat.icon size={24} className="text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Benefits Strip */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            {['No Login Required to Apply', 'Daily Attendance Tracking', 'Certificate on Completion', 'Real Project Experience', 'Expert Mentorship', 'Corporate-style Training'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Internships List */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12" data-aos="fade-up">
            <span className="badge-orange mb-3 inline-block">8 Programs Available</span>
            <h2 className="text-2xl font-bold text-gray-900">Available Internships</h2>
            <p className="text-gray-500 mt-2">Apply directly — no account required</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {internships.map((intern, i) => (
              <div key={intern.id} className="card overflow-hidden group hover:shadow-card-hover transition-all" data-aos="fade-up" data-aos-delay={i * 60}>
                <div className="h-24 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative">
                  <Briefcase size={36} className="text-white/30" />
                  <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                    {intern.mode}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{intern.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-orange-500" /> {intern.duration}
                    </span>
                    {intern.certificate && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Award size={12} /> Cert
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {intern.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="badge-blue text-xs">{skill}</span>
                    ))}
                    {intern.skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{intern.skills.length - 3}</span>
                    )}
                  </div>
                  <Link
                    to={`/internships/${intern.slug}/apply`}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium text-xs transition-all"
                  >
                    Apply Now <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="badge-blue mb-3 inline-block">Process</span>
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">From application to certificate — a transparent 6-step process.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipeline.map((step, i) => (
              <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-xl hover:shadow-md transition-shadow" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3" data-aos="fade-up">Upon Completion You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[
              { icon: '🏆', title: 'Experience Certificate', desc: 'Industry-recognized digital certificate with QR verification.' },
              { icon: '⭐', title: 'Letter of Recommendation', desc: 'On merit, from Mr. Vaibhav Tambe, Founder of TeKVora Infotech.' },
              { icon: '💼', title: 'Portfolio Projects', desc: 'Real projects to showcase to employers.' },
              { icon: '📊', title: 'Performance Report', desc: 'Detailed daily attendance and task completion report.' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-5 text-white" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-blue-200 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
