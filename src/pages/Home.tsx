import { useEffect, useRef, useState } from 'react';
import { Link } from '../lib/router';
import {
  ArrowRight, CheckCircle, Star, Award, Users, BookOpen, Briefcase,
  Globe, Smartphone, Palette, TrendingUp, Cloud, Cpu,
  Shield, Clock, GraduationCap, Handshake, ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';

const stats = [
  { label: 'Students Enrolled', value: '500+', icon: Users },
  { label: 'Courses', value: '5+', icon: BookOpen },
  { label: 'Internships Completed', value: '50+', icon: Briefcase },
  { label: 'Certificates Issued', value: '200+', icon: Award },
  { label: 'College MOUs', value: '10+', icon: Handshake },
];

const services = [
  { icon: Globe, title: 'Web Development', desc: 'Full-stack web solutions with modern frameworks.', color: 'from-blue-500 to-blue-600' },
  { icon: Smartphone, title: 'Mobile Apps', desc: 'Cross-platform apps built with Flutter.', color: 'from-orange-400 to-orange-600' },
  { icon: Palette, title: 'UI/UX Design', desc: 'Beautiful, user-centered digital experiences.', color: 'from-pink-500 to-rose-600' },
  { icon: TrendingUp, title: 'Digital Marketing', desc: 'SEO, social media, and growth strategies.', color: 'from-green-500 to-emerald-600' },
  { icon: Cloud, title: 'Cloud Solutions', desc: 'Scalable cloud infrastructure and deployment.', color: 'from-cyan-500 to-blue-600' },
  { icon: Cpu, title: 'AI & ML', desc: 'Intelligent solutions powered by machine learning.', color: 'from-violet-500 to-purple-600' },
];

const courses = [
  { title: 'Full Stack Web Development', duration: '3 Months', skills: ['HTML', 'CSS', 'JS', 'Django'], slug: 'full-stack-web-development' },
  { title: 'Python Programming', duration: '6 Weeks', skills: ['Python', 'OOP', 'APIs'], slug: 'python-programming' },
  { title: 'Data Science with Python', duration: '2 Months', skills: ['Pandas', 'NumPy', 'ML'], slug: 'data-science-with-python' },
  { title: 'Mobile App Development', duration: '2 Months', skills: ['Flutter', 'Dart', 'Firebase'], slug: 'mobile-app-development' },
];

const internships = [
  { title: 'Web Development Internship', duration: '1 Month', mode: 'Remote/Hybrid', slug: 'web-development-internship' },
  { title: 'Python & Data Science', duration: '1 Month', mode: 'Remote', slug: 'python-data-science-internship' },
  { title: 'UI/UX Design Internship', duration: '1 Month', mode: 'Remote/Hybrid', slug: 'ui-ux-design-internship' },
];

const whyUs = [
  { icon: Award, title: 'Verifiable Certificates', desc: 'QR-coded digital certificates that employers can verify instantly.' },
  { icon: Users, title: 'Expert Mentorship', desc: 'Learn directly from Mr. Vaibhav Tambe — Full Stack Developer & Founder.' },
  { icon: Briefcase, title: 'Real Project Experience', desc: 'Work on actual client projects during your internship.' },
  { icon: Shield, title: 'Industry Recognition', desc: 'MOU-backed programs recognized by partner colleges and universities.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Web Development Intern', text: 'TeKVora gave me the real-world experience I needed. The internship was structured, mentorship was excellent!', rating: 5 },
  { name: 'Rahul Patil', role: 'Full Stack Student', text: 'The curriculum is industry-focused. I built a complete web app by the end of the course. Highly recommended!', rating: 5 },
  { name: 'Sneha Kulkarni', role: 'UI/UX Intern', text: 'Amazing platform for learning design. The certificate helped me land a job within weeks of completing!', rating: 5 },
];

function LaptopTypewriter() {
  const codeLines = [
    '# TeKVora Python Course',
    'def learn_python():',
    '    skills = ["WASM", "AI", "React"]',
    '    for skill in skills:',
    '        print(f"Mastering {skill}...")',
    '    ',
    'learn_python()'
  ];
  
  const [typedText, setTypedText] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= codeLines.length) {
      const restartTimer = setTimeout(() => {
        setTypedText([]);
        setLineIdx(0);
        setCharIdx(0);
      }, 3000);
      return () => clearTimeout(restartTimer);
    }

    const currentLine = codeLines[lineIdx];
    if (charIdx < currentLine.length) {
      const charTimer = setTimeout(() => {
        setTypedText(prev => {
          const newText = [...prev];
          if (!newText[lineIdx]) {
            newText[lineIdx] = '';
          }
          newText[lineIdx] += currentLine[charIdx];
          return newText;
        });
        setCharIdx(prev => prev + 1);
      }, 40 + Math.random() * 30);
      return () => clearTimeout(charTimer);
    } else {
      const lineTimer = setTimeout(() => {
        setLineIdx(prev => prev + 1);
        setCharIdx(0);
      }, 350);
      return () => clearTimeout(lineTimer);
    }
  }, [lineIdx, charIdx]);

  const renderHighlightedLine = (line: string, index: number) => {
    if (!line) return <div key={index} className="h-4 flex items-center"><span className="text-slate-600 select-none w-5 text-right pr-2 mr-2 border-r border-slate-800">{index + 1}</span></div>;
    
    if (line.trim().startsWith('#')) {
      return (
        <div key={index} className="font-mono flex items-center">
          <span className="text-slate-600 select-none w-5 text-right pr-2 mr-2 border-r border-slate-800">{index + 1}</span>
          <span className="text-gray-500">{line}</span>
        </div>
      );
    }

    const parts: JSX.Element[] = [];
    let currentWord = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && (i === 0 || line[i - 1] !== '\\')) {
        if (!inString) {
          if (currentWord) {
            parts.push(highlightWord(currentWord, parts.length));
            currentWord = '';
          }
          inString = true;
          stringChar = char;
          currentWord += char;
        } else if (char === stringChar) {
          currentWord += char;
          parts.push(<span key={parts.length} className="text-green-400 font-mono">{currentWord}</span>);
          currentWord = '';
          inString = false;
        } else {
          currentWord += char;
        }
        continue;
      }

      if (inString) {
        currentWord += char;
        continue;
      }

      if ([' ', '(', ')', '[', ']', ':', ',', '=', '+', '-', '*', '/'].includes(char)) {
        if (currentWord) {
          parts.push(highlightWord(currentWord, parts.length));
          currentWord = '';
        }
        parts.push(<span key={parts.length} className="text-slate-400 font-mono">{char}</span>);
      } else {
        currentWord += char;
      }
    }

    if (currentWord) {
      parts.push(highlightWord(currentWord, parts.length));
    }

    return (
      <div key={index} className="font-mono flex items-center">
        <span className="text-slate-600 select-none w-5 text-right pr-2 mr-2 border-r border-slate-800">{index + 1}</span>
        <span className="flex-grow">{parts}</span>
      </div>
    );
  };

  const highlightWord = (word: string, key: number) => {
    const keywords = ['def', 'for', 'in', 'if', 'import', 'return'];
    const builtins = ['print', 'len', 'range', 'list'];
    
    if (keywords.includes(word)) {
      return <span key={key} className="text-pink-500 font-semibold font-mono">{word}</span>;
    } else if (builtins.includes(word)) {
      return <span key={key} className="text-sky-400 font-mono">{word}</span>;
    } else if (/^[0-9]+$/.test(word)) {
      return <span key={key} className="text-amber-400 font-mono">{word}</span>;
    }
    return <span key={key} className="text-slate-200 font-mono">{word}</span>;
  };

  return (
    <div className="laptop-screen-content bg-slate-950 p-4 border border-slate-900 rounded shadow-inner select-none flex flex-col">
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-900 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        <span className="text-[9px] text-slate-500 font-mono ml-2">sandbox.py</span>
      </div>
      <div className="space-y-1 overflow-hidden flex-grow">
        {codeLines.map((_, idx) => {
          if (idx <= lineIdx) {
            return renderHighlightedLine(typedText[idx] || '', idx);
          }
          return null;
        })}
        {lineIdx < codeLines.length && (
          <span className="inline-block w-1.5 h-3.5 bg-orange-400 animate-pulse ml-1 align-middle"></span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const counterRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);

  const targetX = useRef(10);
  const targetY = useRef(-15);
  const currentX = useRef(10);
  const currentY = useRef(-15);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      targetX.current = 10 - (mouseY / rect.height) * 20;
      targetY.current = -15 + (mouseX / rect.width) * 30;
    };

    const handleMouseLeave = () => {
      targetX.current = 10;
      targetY.current = -15;
    };

    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);

    let animId: number;
    const updateTilt = () => {
      currentX.current += (targetX.current - currentX.current) * 0.08;
      currentY.current += (targetY.current - currentY.current) * 0.08;

      if (laptopRef.current) {
        laptopRef.current.style.transform = `rotateX(${currentX.current}deg) rotateY(${currentY.current}deg)`;
      }
      animId = requestAnimationFrame(updateTilt);
    };

    animId = requestAnimationFrame(updateTilt);

    return () => {
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animated.current) {
            animated.current = true;
            const counters = entry.target.querySelectorAll('[data-count]');
            counters.forEach(counter => {
              const el = counter as HTMLElement;
              el.style.animation = 'countUp 0.6s ease forwards';
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    if (counterRef.current) observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="hero-gradient min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-bubble-1"></div>
          <div className="glow-bubble-2"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full"></div>
          <div className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-orange-500/20 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/20">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                Admissions Open for 2026
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
                {t('welcome')}
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8">
                {t('tagline')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/courses" className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105">
                  Explore Courses <ArrowRight size={18} />
                </Link>
                <Link to="/internships" className="bg-white/15 hover:bg-white/25 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20">
                  Apply for Internship
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-8">
                {['MOU Partners', 'Industry Certificates', 'Expert Mentors'].map((badge) => (
                  <div key={badge} className="flex items-center gap-2 text-blue-100 text-sm">
                    <CheckCircle size={16} className="text-orange-400" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 3D Parallax Laptop Mockup */}
            <div className="hidden lg:flex items-center justify-center relative min-h-[350px]">
              <div className="laptop-container">
                <div ref={laptopRef} className="laptop-mockup">
                  <div className="laptop-shadow"></div>
                  <div className="laptop-screen">
                    <div className="laptop-webcam"></div>
                    <LaptopTypewriter />
                  </div>
                  <div className="laptop-base">
                    <div className="laptop-base-top">
                      <div className="laptop-keyboard"></div>
                      <div className="laptop-trackpad"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" className="fill-current text-white dark:text-slate-900 transition-colors duration-300"/>
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section ref={counterRef} className="bg-white dark:bg-slate-900 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 dark:bg-primary-950/30 rounded-xl mb-3">
                  <stat.icon size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" data-count>{stat.value}</div>
                <div className="text-sm text-gray-505 dark:text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IT Services */}
      <section className="py-20 bg-gray-50 dark:bg-slate-950/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="badge-orange">Our Services</span>
            <h2 className="section-title mt-3 text-gradient-animate">Comprehensive IT Solutions</h2>
            <p className="section-subtitle max-w-2xl mx-auto dark:text-slate-400">
              From web development to AI, we deliver cutting-edge digital solutions tailored to your needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="glass-premium p-6 group cursor-pointer rounded-card transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={i * 80}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon size={26} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">{service.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{service.desc}</p>
                <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium hover:gap-2 transition-all duration-200">
                  Learn More <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-14" data-aos="fade-up">
            <div>
              <span className="badge-blue">Programs</span>
              <h2 className="section-title mt-3 text-gradient-animate">Featured Courses</h2>
              <p className="text-gray-505 dark:text-slate-400 mt-2">Industry-aligned curriculum designed by experts.</p>
            </div>
            <Link to="/courses" className="mt-4 sm:mt-0 btn-outline text-sm">
              View All Courses <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, i) => (
              <div key={i} className="glass-premium overflow-hidden group rounded-card transition-all duration-300" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="h-32 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center relative overflow-hidden">
                  <GraduationCap size={48} className="text-white/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <span className="bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">{course.duration}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white leading-snug mb-3">{course.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.skills.map((skill) => (
                      <span key={skill} className="badge-blue text-xs">{skill}</span>
                    ))}
                  </div>
                  <Link
                    to={`/courses`}
                    className="w-full block text-center bg-primary-50 dark:bg-primary-950/20 hover:bg-primary-600 text-primary-600 hover:text-white dark:text-primary-400 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Internships */}
      <section className="py-20 bg-gray-50 dark:bg-slate-950/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-14" data-aos="fade-up">
            <div>
              <span className="badge-orange">Opportunities</span>
              <h2 className="section-title mt-3 text-gradient-animate">Featured Internships</h2>
              <p className="text-gray-505 dark:text-slate-400 mt-2">Gain real-world experience with industry mentors.</p>
            </div>
            <Link to="/internships" className="mt-4 sm:mt-0 btn-outline text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {internships.map((intern, i) => (
              <div key={i} className="glass-premium p-6 rounded-card transition-all duration-300" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center">
                    <Briefcase size={22} className="text-orange-500" />
                  </div>
                  <span className="badge-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Certificate
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">{intern.title}</h3>
                <div className="flex gap-3 text-sm text-gray-505 dark:text-slate-400 mb-5">
                  <span className="flex items-center gap-1"><Clock size={13} /> {intern.duration}</span>
                  <span className="flex items-center gap-1"><Globe size={13} /> {intern.mode}</span>
                </div>
                <Link to={`/internships`} className="btn-orange w-full text-center text-sm py-2.5 rounded-lg justify-center">
                  Apply Now <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOU Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold text-white mb-3">College MOU Partnership</h2>
              <p className="text-blue-100 text-lg max-w-xl">
                We partner with colleges and universities to deliver structured internship and training programs — empowering students with industry-ready skills.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4" data-aos="fade-left">
              <Link to="/mou" className="bg-white text-primary-600 hover:bg-gray-50 px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all">
                Learn More <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20discuss%20MOU%20partnership."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all"
              >
                Request MOU Discussion
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="badge-blue">Why TeKVora</span>
            <h2 className="section-title mt-3">Why Choose Us?</h2>
            <p className="section-subtitle max-w-xl mx-auto dark:text-slate-400">We're committed to your success with industry-aligned programs and expert guidance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <div key={i} className="text-center p-6 group cursor-pointer hover:-translate-y-2 transition-all duration-300" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-950/30 dark:border dark:border-primary-500/20 rounded-2xl mb-5 mx-auto transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                  <item.icon size={28} className="text-primary-600 dark:text-primary-400 filter dark:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-all duration-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">{item.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="badge-orange">Reviews</span>
            <h2 className="section-title mt-3">What Our Students Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-slate-350 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-gray-400 dark:text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center" data-aos="fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-6">
            <i className="fab fa-whatsapp text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Have Questions? Chat With Us!</h2>
          <p className="text-gray-400 mb-8">Our team is available to answer your questions about courses, internships, and admissions.</p>
          <a
            href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20want%20to%20know%20more."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
          >
            <i className="fab fa-whatsapp text-2xl"></i>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  );
}
