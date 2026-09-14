import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { GraduationCap, Clock, CheckCircle, ArrowRight, Search, Users, Award, TrendingUp, BookOpen, Code, Database, Smartphone, Palette, Server, Cloud, Layers, ChevronRight, Star, PlayCircle, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Course } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

const staticCourses: Course[] = [
  { id: '1', title: 'Full Stack Web Development', slug: 'full-stack-web-development', description: 'Master the complete web development stack from frontend to backend. Build real-world projects using Django, React, and MySQL.', duration: '3 Months', skills: ['HTML', 'CSS', 'JavaScript', 'Django', 'MySQL', 'React'], instructor: 'Mr. Vaibhav Tambe', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '2', title: 'Python Programming', slug: 'python-programming', description: 'Learn Python from scratch to advanced level. Cover OOP, APIs, and practical applications across multiple domains.', duration: '6 Weeks', skills: ['Python', 'OOP', 'APIs', 'Data Structures'], instructor: 'Mr. Vaibhav Tambe', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '3', title: 'Data Science with Python', slug: 'data-science-with-python', description: 'Dive into data science. Analyze data, build ML models, and extract actionable insights from complex datasets.', duration: '2 Months', skills: ['Pandas', 'NumPy', 'ML Basics', 'Visualization', 'Jupyter'], instructor: 'Mr. Vaibhav Tambe', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '4', title: 'Mobile App Development', slug: 'mobile-app-development', description: 'Build cross-platform mobile applications using Flutter and Dart with Firebase backend. Deploy to iOS and Android.', duration: '2 Months', skills: ['Flutter', 'Dart', 'Firebase', 'UI Design'], instructor: 'Mr. Vaibhav Tambe', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '5', title: 'UI/UX Design', slug: 'ui-ux-design', description: 'Master user interface and experience design. Create stunning prototypes, wireframes, and design systems using Figma.', duration: '6 Weeks', skills: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems', 'User Research'], instructor: 'Ms. Priya Sharma', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '6', title: 'React.js Development', slug: 'react-development', description: 'Master modern frontend development with React. Learn components, hooks, state management, and API integration.', duration: '2 Months', skills: ['React', 'JSX', 'Hooks', 'Redux', 'APIs', 'Next.js'], instructor: 'Mr. Rahul Patil', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '7', title: 'Node.js Backend Development', slug: 'nodejs-backend', description: 'Build scalable backend services with Node.js and Express. Learn REST APIs, databases, and authentication.', duration: '6 Weeks', skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JWT', 'Authentication'], instructor: 'Mr. Amit Deshmukh', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
  { id: '8', title: 'Cloud Computing (AWS)', slug: 'cloud-computing-aws', description: 'Master cloud infrastructure on AWS. Learn EC2, S3, Lambda, and DevOps practices for scalable deployments.', duration: '1 Month', skills: ['AWS', 'EC2', 'S3', 'Lambda', 'Docker', 'DevOps'], instructor: 'Mr. Amit Deshmukh', type: 'Paid', certificate_eligible: true, status: 'active', created_at: '' },
];

const courseImages: Record<string, string> = {
  'full-stack-web-development': 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600',
  'python-programming': 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600',
  'data-science-with-python': 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=600',
  'mobile-app-development': 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
  'ui-ux-design': 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=600',
  'react-development': 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=600',
  'nodejs-backend': 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600',
  'cloud-computing-aws': 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
};

const courseIcons: Record<string, React.ElementType> = {
  'full-stack-web-development': Code,
  'python-programming': BookOpen,
  'data-science-with-python': Database,
  'mobile-app-development': Smartphone,
  'ui-ux-design': Palette,
  'react-development': Layers,
  'nodejs-backend': Server,
  'cloud-computing-aws': Cloud,
};

const courseDetails: Record<string, { modules: number; projects: number; level: string; rating: string }> = {
  'full-stack-web-development': { modules: 12, projects: 5, level: 'Beginner to Advanced', rating: '4.9' },
  'python-programming': { modules: 8, projects: 3, level: 'Beginner', rating: '4.8' },
  'data-science-with-python': { modules: 10, projects: 4, level: 'Intermediate', rating: '4.7' },
  'mobile-app-development': { modules: 10, projects: 4, level: 'Intermediate', rating: '4.8' },
  'ui-ux-design': { modules: 8, projects: 6, level: 'Beginner', rating: '4.9' },
  'react-development': { modules: 10, projects: 4, level: 'Intermediate', rating: '4.8' },
  'nodejs-backend': { modules: 9, projects: 3, level: 'Intermediate', rating: '4.7' },
  'cloud-computing-aws': { modules: 7, projects: 3, level: 'Advanced', rating: '4.8' },
};

const stats = [
  { icon: Users, value: '1000+', label: 'Students Enrolled' },
  { icon: GraduationCap, value: '8+', label: 'Courses' },
  { icon: Award, value: '300+', label: 'Certificates Issued' },
  { icon: TrendingUp, value: '95%', label: 'Success Rate' },
];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>(staticCourses);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { user } = useAuth();

  // AI Recommender states
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizGoal, setQuizGoal] = useState('web');
  const [quizExp, setQuizExp] = useState('beginner');
  const [quizLoading, setQuizLoading] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [aiRecomIds, setAiRecomIds] = useState<string[]>([]);

  const handleRecommend = () => {
    setQuizLoading(true);
    setTimeout(() => {
      if (quizGoal === 'web') {
        setRecommendation('We recommend enrolling in the "Full Stack Web Development" course. It covers HTML, CSS, JavaScript, React, and Django backend integration.');
        setAiRecomIds(['1', '6']);
      } else if (quizGoal === 'python') {
        setRecommendation('We recommend enrolling in "Python Programming". Ideal for beginners looking to master scripting, backend development, and REST APIs.');
        setAiRecomIds(['2', '7']);
      } else if (quizGoal === 'data') {
        setRecommendation('We recommend enrolling in "Data Science with Python". It covers NumPy, Pandas, Data Visualization, and Machine Learning.');
        setAiRecomIds(['3']);
      } else {
        setRecommendation('We recommend enrolling in "Mobile App Development". Learn cross-platform apps using Flutter and Dart.');
        setAiRecomIds(['4']);
      }
      setQuizLoading(false);
    }, 1200);
  };

  useEffect(() => {
    supabase.from('courses').select('*').eq('status', 'active')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Failed to fetch courses from Supabase:', error);
          return;
        }
        if (data && data.length > 0) setCourses(data as Course[]);
      })
      .catch((err: any) => {
        console.error('Error fetching courses:', err);
      });
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/10 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <GraduationCap size={16} /> Industry-Aligned Programs
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Courses</h1>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">
              8 comprehensive programs designed with industry experts to make you job-ready from day one.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses or skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-800 bg-white border-0 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Notice */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-orange-700 text-sm">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>All courses include a verifiable digital certificate upon completion. Pay via UPI and upload payment proof for enrollment.</span>
        </div>
      </div>

      {/* AI Course Recommender */}
      <div className="bg-gray-50 pt-10 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
            <div className="max-w-xl relative z-10 space-y-4">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full border border-white/10 font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <Sparkles size={12} className="text-amber-400" /> AI-Powered
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight">Not sure where to start your coding journey?</h2>
              <p className="text-xs text-indigo-200">Answer 3 questions and let our AI doubt solver map the perfect courses for your goals.</p>
              
              {!showQuiz ? (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="bg-white text-indigo-905 hover:bg-gray-150 text-indigo-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Get AI Course Recommendation
                </button>
              ) : (
                <div className="bg-[#1e1b4b]/60 border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
                  {recommendation ? (
                    <div className="space-y-3">
                      <h4 className="font-bold text-amber-400">Recommended Courses for you:</h4>
                      <p className="text-slate-350 leading-relaxed font-mono">{recommendation}</p>
                      <button
                        onClick={() => { setShowQuiz(false); setRecommendation(''); }}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl"
                      >
                        Reset Recommendation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white/70 mb-1">1. What is your career goal?</label>
                        <select
                          value={quizGoal}
                          onChange={e => setQuizGoal(e.target.value)}
                          className="bg-[#0f172a] border border-white/20 rounded-xl px-3 py-2 text-white w-full outline-none"
                        >
                          <option value="web">Web App Development</option>
                          <option value="python">Backend & Automation</option>
                          <option value="data">Data Analysis & Math</option>
                          <option value="mobile">Mobile Apps</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">2. Current Coding Experience?</label>
                        <select
                          value={quizExp}
                          onChange={e => setQuizExp(e.target.value)}
                          className="bg-[#0f172a] border border-white/20 rounded-xl px-3 py-2 text-white w-full outline-none"
                        >
                          <option value="beginner">Absolute Beginner</option>
                          <option value="intermediate">Know basic variables & loops</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => setShowQuiz(false)}
                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRecommend}
                          disabled={quizLoading}
                          className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl"
                        >
                          {quizLoading ? 'Analyzing...' : 'Get Result'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No courses found for "{search}"</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course, i) => {
                const Icon = courseIcons[course.slug] || BookOpen;
                const details = courseDetails[course.slug];
                return (
                  <div key={course.id} className="card overflow-hidden group hover:shadow-card-hover transition-all" data-aos="fade-up" data-aos-delay={i * 60}>
                    {/* Course Image */}
                    <div className="h-40 relative overflow-hidden">
                      {aiRecomIds.includes(course.id) && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shadow-md shadow-purple-500/30 animate-pulse">
                            <Sparkles size={10} fill="white" /> AI Recommended
                          </span>
                        </div>
                      )}
                      <img
                        src={courseImages[course.slug] || 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/30 font-medium">
                          {course.type}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <span className="bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <Clock size={10} /> {course.duration}
                        </span>
                      </div>
                      {course.certificate_eligible && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle size={10} /> Certificate
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon size={20} className="text-white" />
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{course.description}</p>

                      {/* Course Details */}
                      {details && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <BookOpen size={12} className="text-primary-500 mx-auto mb-0.5" />
                            <p className="text-[10px] text-gray-400">Modules</p>
                            <p className="text-xs font-semibold text-gray-700">{details.modules}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <PlayCircle size={12} className="text-orange-500 mx-auto mb-0.5" />
                            <p className="text-[10px] text-gray-400">Projects</p>
                            <p className="text-xs font-semibold text-gray-700">{details.projects}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <Star size={12} className="text-yellow-500 mx-auto mb-0.5" />
                            <p className="text-[10px] text-gray-400">Rating</p>
                            <p className="text-xs font-semibold text-gray-700">{details.rating}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="badge-blue text-xs">{skill}</span>
                        ))}
                        {course.skills.length > 3 && (
                          <span className="text-xs text-gray-400">+{course.skills.length - 3}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">VT</div>
                        <span className="truncate">{course.instructor}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                        {user ? (
                          <Link
                            to="/dashboard"
                            className="flex-1 block text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Enroll Now <ArrowRight size={12} className="inline" />
                          </Link>
                        ) : (
                          <Link
                            to="/login"
                            className="flex-1 block text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Login to Enroll <ArrowRight size={12} className="inline" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCourse(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="h-48 relative overflow-hidden rounded-t-2xl">
              <img
                src={courseImages[selectedCourse.slug] || 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600'}
                alt={selectedCourse.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <button onClick={() => setSelectedCourse(null)} className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <ChevronRight size={18} className="rotate-90" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{selectedCourse.duration}</span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{courseDetails[selectedCourse.slug]?.level}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedCourse.description}</p>

              {courseDetails[selectedCourse.slug] && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-primary-50 rounded-xl p-3 text-center">
                    <BookOpen size={16} className="text-primary-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary-700">{courseDetails[selectedCourse.slug].modules}</p>
                    <p className="text-xs text-gray-500">Modules</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <PlayCircle size={16} className="text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-orange-700">{courseDetails[selectedCourse.slug].projects}</p>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <Star size={16} className="text-yellow-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-yellow-700">{courseDetails[selectedCourse.slug].rating}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Skills You'll Learn</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.skills.map(skill => (
                    <span key={skill} className="badge-blue text-xs">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">VT</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedCourse.instructor}</p>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedCourse(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Close
                </button>
                {user ? (
                  <Link to="/dashboard" onClick={() => setSelectedCourse(null)} className="flex-1 block text-center bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-semibold transition-colors">
                    Enroll Now
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setSelectedCourse(null)} className="flex-1 block text-center bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-semibold transition-colors">
                    Login to Enroll
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-primary-900">
        <div className="max-w-3xl mx-auto px-4 text-center" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-white mb-3">Not sure which course to pick?</h2>
          <p className="text-gray-300 mb-6">Chat with us on WhatsApp and we'll guide you to the right program.</p>
          <a
            href="https://wa.me/919022302322?text=Hi%20TeKVora!%20I%20need%20help%20choosing%20a%20course."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all"
          >
            <i className="fab fa-whatsapp text-xl"></i>
            Ask on WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  );
}
