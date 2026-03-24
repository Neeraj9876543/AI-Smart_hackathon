import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, FileText, BarChart3, Shield, ArrowRight, GraduationCap, Users, CheckCircle } from 'lucide-react';
import heroDashboard from '../assets/hero-dashboard.jpg';

const features = [
  { icon: Award, title: 'Achievement Tracking', desc: 'Track hackathons, internships, research papers, workshops and more in one place.' },
  { icon: FileText, title: 'Document Repository', desc: 'Securely upload and manage Aadhaar, PAN, mark memos, and certificates.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Visual reports for NAAC accreditation with department-wise and year-wise insights.' },
  { icon: Shield, title: 'Admin Verification', desc: 'Admins verify documents and achievements with a single click.' },
];

const stats = [
  { value: '5,000+', label: 'Students Managed' },
  { value: '15,000+', label: 'Achievements Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50+', label: 'Departments' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
            <GraduationCap className="text-primary-foreground" size={20} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">ScholarGraph</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            className="gradient-brand text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
              <CheckCircle size={14} />
              Trusted by 50+ Colleges
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-black tracking-tight text-foreground leading-tight">
              Your Academic Legacy,{' '}
              <span className="text-gradient">Quantified.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed">
              A comprehensive platform to track student achievements, manage documents, and generate analytics for accreditation — all in one place.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => navigate('/login')}
                className="gradient-brand text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Get Started <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-border text-foreground px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-secondary transition-colors"
              >
                Explore Features
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 gradient-brand rounded-3xl opacity-10 blur-2xl" />
            <img
              src={heroDashboard}
              alt="ScholarGraph Dashboard Preview"
              className="relative rounded-2xl shadow-soft border border-border w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="px-6 lg:px-16 py-16 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl lg:text-4xl font-display font-black text-gradient">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold tracking-tight text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Built for universities that demand precision, clarity, and ease of use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-6 rounded-2xl border border-border shadow-card hover:shadow-soft transition-shadow duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <feat.icon className="text-primary" size={22} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-6 lg:px-16 py-20 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="mx-auto text-primary mb-4" size={36} />
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Built for Modern Universities</h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            ScholarGraph replaces outdated university ERP modules with a modern, fast, and secure platform. Track every hackathon, internship, research paper, and workshop — verified by admins, ready for NAAC audits.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-brand rounded flex items-center justify-center">
              <GraduationCap className="text-primary-foreground" size={14} />
            </div>
            <span className="font-display font-bold text-sm text-foreground">ScholarGraph</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 ScholarGraph. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
