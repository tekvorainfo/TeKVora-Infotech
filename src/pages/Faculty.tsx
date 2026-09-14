import { Award, BookOpen, Briefcase, Code, Users, Star, GraduationCap, Mail, Globe } from 'lucide-react';
import Layout from '../components/Layout';

const skills = [
  { category: 'Frontend', items: ['React', 'HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'Bootstrap'] },
  { category: 'Backend', items: ['Django', 'Python', 'REST APIs', 'Node.js'] },
  { category: 'Database', items: ['MySQL', 'PostgreSQL', 'SQLite', 'Firebase'] },
  { category: 'Tools', items: ['Git', 'Docker', 'Linux', 'Figma', 'VS Code'] },
];

const achievements = [
  { icon: Users, value: '1000+', label: 'Students Trained' },
  { icon: BookOpen, value: '8+', label: 'Courses Designed' },
  { icon: Briefcase, value: '100+', label: 'Interns Mentored' },
  { icon: Award, value: '300+', label: 'Certificates Issued' },
];

const expertTrainers = [
  {
    name: 'Ms. Priya Sharma',
    role: 'UI/UX Design Specialist',
    skills: ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research'],
    experience: '5+ Years',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Specializes in creating user-centered designs. Has worked with top startups on product design.',
  },
  {
    name: 'Mr. Rahul Patil',
    role: 'Python & Data Science Expert',
    skills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'TensorFlow'],
    experience: '7+ Years',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Data scientist with experience in building predictive models and data pipelines for enterprises.',
  },
  {
    name: 'Ms. Sneha Kulkarni',
    role: 'Mobile App Developer',
    skills: ['Flutter', 'Dart', 'Firebase', 'iOS', 'Android'],
    experience: '4+ Years',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Cross-platform mobile expert. Published 20+ apps on Play Store and App Store.',
  },
  {
    name: 'Mr. Amit Deshmukh',
    role: 'Cloud & DevOps Engineer',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    experience: '6+ Years',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Cloud architect specializing in scalable infrastructure and DevOps practices.',
  },
];

export default function Faculty() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-500/10 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-aos="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Users size={16} /> Meet Our Experts
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Faculty & Trainers</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Learn from industry professionals with real-world experience and passion for teaching.
            </p>
          </div>
        </div>
      </section>

      {/* Main Faculty Card - Founder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10" data-aos="fade-up">
            <span className="badge-orange">Founder & Lead Instructor</span>
          </div>

          <div className="card overflow-hidden bg-white shadow-xl" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row">
              {/* Image Section */}
              <div className="lg:w-2/5 bg-gradient-to-br from-primary-600 to-primary-800 p-8 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
                </div>
                <div className="relative">
                  <div className="w-56 h-56 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
                    <img
                      src="/vaibhav_profile.png"
                      alt="Mr. Vaibhav Tambe - Founder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Founder
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="lg:w-3/5 p-8 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-gray-900">Mr. Vaibhav Tambe</h2>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-orange-400 fill-orange-400" />)}
                  </div>
                </div>
                <p className="text-primary-600 font-semibold text-lg mb-1">Full Stack Developer & Tech Educator</p>
                <p className="text-gray-400 text-sm mb-5 flex items-center gap-2">
                  <Globe size={14} className="text-primary-400" />
                  Sambhaji Residency, Phase 3, Gat No. 12, Row House No. 11/18, Behind Devgiri Bank, Paithan Road, Chh. Sambhajinagar, MH
                </p>

                <div className="prose prose-gray max-w-none mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    Mr. Vaibhav Tambe is a passionate Full Stack Developer and tech educator dedicated to bridging the gap between academic education and industry requirements. As the <strong>Founder of TeKVora Infotech</strong>, he has designed comprehensive courses and internship programs that give students real-world exposure and industry-recognized credentials.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    With expertise spanning across web development, Python, data science, and mobile applications, Mr. Tambe brings practical knowledge and mentorship to every program. His teaching philosophy focuses on <strong>learning by doing</strong> — students work on real projects from day one.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">5+</p>
                    <p className="text-xs text-gray-500">Years Experience</p>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <p className="text-2xl font-bold text-primary-600">1000+</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">8+</p>
                    <p className="text-xs text-gray-500">Courses</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/919022302322?text=Hi%20Mr.%20Tambe!%20I%20have%20a%20question."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                  >
                    <i className="fab fa-whatsapp text-lg"></i>
                    Connect on WhatsApp
                  </a>
                  <a
                    href="mailto:vaibhav@tekvora.com"
                    className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-600 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                  >
                    <Mail size={16} />
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {achievements.map((a, i) => (
              <div key={i} className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-3">
                  <a.icon size={22} className="text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{a.value}</div>
                <div className="text-sm text-gray-500 mt-1">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10" data-aos="fade-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Expertise</h2>
            <p className="text-gray-500">Technologies and tools we teach</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((cat, i) => (
              <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <Code size={16} className="text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{cat.category}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((skill) => (
                    <span key={skill} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Trainers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12" data-aos="fade-up">
            <span className="badge-blue mb-3 inline-block">Expert Team</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Expert Trainers</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Industry professionals who bring real-world experience to our classrooms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expertTrainers.map((trainer, i) => (
              <div key={i} className="card overflow-hidden group hover:shadow-card-hover transition-all duration-300" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trainer.image}
                    alt={trainer.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold">{trainer.name}</p>
                    <p className="text-gray-300 text-xs">{trainer.role}</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {trainer.experience}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trainer.bio}</p>
                  <div className="flex flex-wrap gap-1">
                    {trainer.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="badge-blue text-xs">{skill}</span>
                    ))}
                    {trainer.skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{trainer.skills.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join as Trainer CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div data-aos="fade-up">
            <GraduationCap size={48} className="text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Want to Join Our Team?</h2>
            <p className="text-gray-300 mb-8">We're always looking for passionate industry experts to join our training team.</p>
            <a
              href="https://wa.me/919022302322?text=Hi!%20I'm%20interested%20in%20joining%20TeKVora%20as%20a%20trainer."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
