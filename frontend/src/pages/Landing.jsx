import { Link } from 'react-router-dom';
import { Cloud, BookOpen, Shield, Search, Share2, Zap, Users, Database, Activity, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Database, title: 'Cloud Storage', desc: 'Securely store all your study materials in AWS S3 with unlimited scalability.', color: 'indigo' },
  { icon: Shield, title: 'Secure Auth', desc: 'JWT-based authentication with role-based access control for students and admins.', color: 'violet' },
  { icon: Search, title: 'Easy Search', desc: 'Full-text search across all resources to find exactly what you need instantly.', color: 'sky' },
  { icon: Share2, title: 'Instant Share', desc: 'Generate shareable links for any resource to collaborate with classmates.', color: 'emerald' },
  { icon: Shield, title: 'Admin Control', desc: 'Comprehensive admin panel to manage users, resources, and system health.', color: 'amber' },
  { icon: Zap, title: 'Always Available', desc: '99.9% uptime with AWS infrastructure ensuring resources are always accessible.', color: 'rose' },
];

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up with your college email and get instant access to all features.' },
  { step: '02', title: 'Upload Resources', desc: 'Drag and drop your PDFs, notes, presentations – any file up to 50MB.' },
  { step: '03', title: 'Share & Collaborate', desc: 'Browse resources from peers, download, and share links with your class.' },
];

const colorMap = {
  indigo: 'bg-indigo-500/10 text-indigo-400',
  violet: 'bg-violet-500/10 text-violet-400',
  sky: 'bg-sky-500/10 text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-rose-500/10 text-rose-400',
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CampusCloud</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Smart Campus Resource Management System
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent leading-tight mb-6">
            Your Campus Resources,<br />Organized in the Cloud
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload, browse, and share study materials seamlessly. Access notes, assignments, 
            research papers, and more — anytime, anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Hero image mockup */}
          <div className="mt-16 relative">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl shadow-black/50 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="flex-1 bg-slate-800 rounded-full h-5 ml-2" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['Notes', 'Assignments', 'Projects'].map((cat) => (
                  <div key={cat} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg mb-2 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-xs text-slate-300 font-medium">{cat}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Multiple files</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-200 font-medium">Data Structures Notes.pdf</div>
                    <div className="text-xs text-slate-500">2.4 MB · Uploaded 2 hours ago</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">PDF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Resources Shared' },
            { value: '500+', label: 'Active Students' },
            { value: '99.9%', label: 'Uptime' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage campus resources
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete platform built for students and faculty to share knowledge efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/40 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400">Get started in minutes with three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-slate-400 mb-8">
              Join hundreds of students already using CampusCloud to share and access resources.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">CampusCloud</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 CampusCloud. Smart Campus Resource Management System.</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
