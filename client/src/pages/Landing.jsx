import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, ShieldCheck, BarChart3, BookOpen, 
  ArrowRight, ExternalLink, Code, Zap, Map 
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Landing() {
  
  useEffect(() => {
    document.title = 'LaunchPad — Prep smarter. Apply faster.';
  }, []);

  return (
    <div className="min-h-screen bg-bg-body text-text-primary flex flex-col pt-20 overflow-x-hidden">
      <Navbar />

      {/* SECTION 1 — HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Subtle grid background accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

        <div className="relative text-center max-w-4xl mx-auto space-y-8 z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#185FA5]/10 text-[#185FA5] dark:bg-[#60A5FA]/10 dark:text-[#60A5FA] border border-[#185FA5]/20 animate-pulse">
              🚀 Now in public beta
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none text-text-primary">
            Stop applying manually.<br />
            <span className="bg-gradient-to-r from-[#185FA5] to-[#4085c7] dark:from-[#60A5FA] dark:to-[#93C5FD] bg-clip-text text-transparent">
              Start landing interviews.
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto font-normal leading-relaxed">
            LaunchPad automates your job applications across LinkedIn and Naukri, tracks every result, and gives you everything you need to ace the interview.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#185FA5] hover:bg-[#15508a] text-white font-bold rounded-xl shadow-lg shadow-[#185FA5]/25 hover:shadow-[#185FA5]/35 transition-all text-center flex items-center justify-center gap-2 group"
            >
              Get started free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/prep-hub"
              className="w-full sm:w-auto px-8 py-4 bg-surface border border-border-default hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary font-bold rounded-xl transition-colors text-center"
            >
              Explore prep hub
            </Link>
          </div>

          <p className="text-sm text-text-secondary font-medium pt-2">
            Joined by <span className="text-[#185FA5] dark:text-[#60A5FA] font-bold">1,200+ professionals</span> switching jobs
          </p>
        </div>
      </section>

      {/* SECTION 2 — 3 FEATURE PILLARS */}
      <section className="py-20 bg-surface/50 border-y border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="p-8 bg-bg-body border border-border-default rounded-2xl shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#185FA5] dark:text-[#60A5FA] border border-blue-100 dark:border-blue-900/30">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">🤖 Apply automatically</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Connect LinkedIn and Naukri once. LaunchPad applies to matching jobs daily while you focus on prep.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 bg-bg-body border border-border-default rounded-2xl shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[#185FA5] dark:text-[#60A5FA] border border-indigo-100 dark:border-indigo-900/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">📊 Track everything</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Every application logged — success, failed, skipped. Full audit trail with clean CSV exports.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 bg-bg-body border border-border-default rounded-2xl shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-[#185FA5] dark:text-[#60A5FA] border border-green-100 dark:border-green-900/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">📚 Prep smarter</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Curated DSA sheets, roadmaps, and interview guides. All free, no signup or credit cards needed.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-16">
          Up and running in 3 steps
        </h2>

        {/* Stepper container */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-12 max-w-5xl mx-auto">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-7 left-10 right-10 h-0.5 bg-gray-200 dark:bg-gray-800 z-0" />

          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#185FA5] text-white font-extrabold text-lg flex items-center justify-center shadow-md mb-6 border-4 border-bg-body">
              1
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Create your profile</h3>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Add your skills, target roles, and upload your resume. Takes less than 2 minutes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#185FA5] text-white font-extrabold text-lg flex items-center justify-center shadow-md mb-6 border-4 border-bg-body">
              2
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Connect your accounts</h3>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              OAuth-powered LinkedIn and Naukri integration. We use session tokens, never storing your password.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#185FA5] text-white font-extrabold text-lg flex items-center justify-center shadow-md mb-6 border-4 border-bg-body">
              3
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Let it run</h3>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Set your daily limits and schedules. LaunchPad applies quietly in the background while you sleep.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — STATS BAR */}
      <section className="bg-[#185FA5] text-white py-12 px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold">1,200+</p>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 uppercase tracking-wider font-semibold">Professionals</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold">8,400+</p>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 uppercase tracking-wider font-semibold">Jobs Applied</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold">91%</p>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 uppercase tracking-wider font-semibold">Success Rate</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold">Free</p>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 uppercase tracking-wider font-semibold">Forever* <span className="opacity-70 text-[10px]">during beta</span></p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — PREP HUB PREVIEW */}
      <section className="py-24 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold text-text-primary">Everything you need to prepare</h2>
            <p className="text-sm text-text-secondary">Free learning resources, no registration required</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Hardcoded Striver */}
            <a
              href="https://takeuforward.org/strivers-a2z-dsa-course"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-6 bg-bg-body border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-surface border border-gray-100 dark:border-gray-800 rounded-xl">
                    <Code className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Most Popular
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-1">
                  Striver A2Z DSA Sheet
                  <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  450+ problems covering every DSA topic from scratch. The most popular structured sheet.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#185FA5] dark:text-[#60A5FA] mt-6">
                Visit resource
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Hardcoded Neetcode */}
            <a
              href="https://neetcode.io/practice"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-6 bg-bg-body border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-surface border border-gray-100 dark:border-gray-800 rounded-xl">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    FAANG Focused
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-1">
                  NeetCode 150
                  <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  150 carefully selected LeetCode problems covering all patterns needed for FAANG interviews.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#185FA5] dark:text-[#60A5FA] mt-6">
                Visit resource
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Hardcoded roadmap */}
            <a
              href="https://roadmap.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-6 bg-bg-body border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-surface border border-gray-100 dark:border-gray-800 rounded-xl">
                    <Map className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Visual Guide
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-1">
                  roadmap.sh
                  <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Visual roadmaps for Frontend, Backend, DevOps, and more. Know exactly what to learn next.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#185FA5] dark:text-[#60A5FA] mt-6">
                Visit resource
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/prep-hub"
              className="inline-flex items-center gap-1 text-[#185FA5] dark:text-[#60A5FA] font-bold hover:underline"
            >
              Browse all resources
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="py-24 bg-surface text-center px-4 sm:px-6 lg:px-8 border-t border-border-default">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
            Ready to land your next role?
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
            Join professionals who stopped applying manually and started getting callbacks.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#185FA5] hover:bg-[#15508a] text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Create free account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-text-secondary">
            No credit card required · Free during beta period
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#185FA5] text-white flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white">
              LaunchPad — <span className="font-normal text-gray-400 text-sm">Prep smarter. Apply faster.</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold">
            <Link to="/prep-hub" className="hover:text-white transition-colors">Prep Hub</Link>
            <a href="/prep-hub#blog" className="hover:text-white transition-colors">Blog</a>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>

          {/* Credit */}
          <div className="text-sm">
            Built with <span className="text-[#185FA5] dark:text-[#60A5FA]">♥</span> for job seekers
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800/60 mt-8 pt-6 text-center text-xs">
          <p>© {new Date().getFullYear()} LaunchPad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
