import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";

function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-sm font-medium mb-8 border border-blue-200/50 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Modern Digital Payment Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Simple, Secure
                <span className="block mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Payments.
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                PayFlow gives customers a secure digital wallet and makes it
                simple to send money, make payments, track transactions, and
                manage refunds — all in one place.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all duration-200"
                >
                  Create Your Account
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure authentication
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Digital wallet
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Transaction tracking
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-[2rem] blur-2xl scale-95" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60 p-3 sm:p-4">
                <img
                  src={heroImage}
                  alt="PayFlow payment platform"
                  className="w-full max-w-md lg:max-w-lg rounded-[1.5rem] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-sm font-semibold tracking-wider text-blue-600 uppercase">
              Features
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Everything you need for digital payments
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              PayFlow combines wallet management, payments, transfers, and
              transaction tracking in one clean platform.
            </p>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "💳",
                title: "Digital Wallet",
                desc: "Manage your balance, deposits, withdrawals, and wallet transactions from one place.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: "⚡",
                title: "Fast Payments",
                desc: "Make secure payments through a reliable and streamlined processing workflow.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: "🔄",
                title: "Easy Transfers",
                desc: "Transfer funds between users instantly and keep a clear record of every move.",
                color: "bg-violet-50 text-violet-600",
              },
              {
                icon: "📊",
                title: "Transaction Tracking",
                desc: "View payments, refunds, transfers, and full activity history whenever you need.",
                color: "bg-amber-50 text-amber-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-7 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-2xl mb-5`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-sm font-semibold tracking-wider text-blue-600 uppercase">
              How it works
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Get started in four simple steps
            </h2>
          </div>

          <div className="mt-16 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            <div className="grid md:grid-cols-4 gap-10 md:gap-6">
              {[
                {
                  step: "1",
                  title: "Create an Account",
                  desc: "Register securely and create your PayFlow wallet in minutes.",
                },
                {
                  step: "2",
                  title: "Fund Your Wallet",
                  desc: "Add funds and manage your available balance with ease.",
                },
                {
                  step: "3",
                  title: "Make Payments",
                  desc: "Send payments or transfer funds securely to anyone.",
                },
                {
                  step: "4",
                  title: "Track Everything",
                  desc: "Monitor transactions, refunds, and full account activity.",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-600/30 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="mt-6 font-semibold text-lg text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-[220px] mx-auto">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-block text-sm font-semibold tracking-wider text-blue-600 uppercase">
                Security
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Built with security in mind
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                PayFlow uses modern authentication, role-based access control,
                transaction tracking, and robust backend security to protect
                every payment operation.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: "🔐",
                  title: "Authentication",
                  desc: "Secure account authentication with protected API access.",
                },
                {
                  icon: "🛡️",
                  title: "Role-Based Access",
                  desc: "Customer and merchant features protected by clear user roles.",
                },
                {
                  icon: "📋",
                  title: "Audit Tracking",
                  desc: "Important payment activities recorded for full auditing.",
                },
                {
                  icon: "🔄",
                  title: "Reliable Processing",
                  desc: "Payments, refunds, settlements, and reconciliation support.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Ready to experience PayFlow?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Create your account and start managing your digital payments today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center mt-9 px-9 py-4 rounded-xl bg-white text-blue-700 font-semibold shadow-xl hover:bg-blue-50 transition-colors duration-200"
          >
            Get Started — It’s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                PayFlow
              </h3>
              <p className="mt-2 text-sm max-w-xs">
                Full-stack payment gateway and digital wallet platform built for
                modern businesses and users.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Register
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#security" className="hover:text-white transition-colors">
                Security
              </a>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} PayFlow. All rights reserved.</p>
            <p className="text-slate-500">Built with security & simplicity in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;