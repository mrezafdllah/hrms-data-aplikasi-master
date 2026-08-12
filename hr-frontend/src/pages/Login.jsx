import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

const SLIDES = [
  {
    badge: "HR Master System",
    title: "Sistem Manajemen SDM Digital Terintegrasi",
    subtitle: "Kelola seluruh data karyawan, struktur posisi jabatan, dan profil perusahaan secara terpusat.",
    badgeColor: "bg-purple-100 text-[#7b3fe4]"
  },
  {
    badge: "Multi-Role Security",
    title: "Otorisasi Akses Berbasis Peran Terstruktur",
    subtitle: "Keamanan data tinggi dengan kontrol hak akses teratur, terenkripsi, dan terproteksi secara menyeluruh.",
    badgeColor: "bg-blue-100 text-[#3a6bf6]"
  },
  {
    badge: "Web & Mobile Portal",
    title: "Aksesibilitas Multi-Platform Kapan Saja",
    subtitle: "Akses informasi HR dengan fleksibel melalui Web Portal dan Portal Mobile Karyawan.",
    badgeColor: "bg-orange-100 text-[#ff5f2d]"
  }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanBaseUrl = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : '';
      const loginUrl = cleanBaseUrl ? `${cleanBaseUrl}/api/login` : '/api/login';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('name', data.name);
        localStorage.setItem('lastActiveTime', Date.now().toString());
        navigate('/');
      } else {
        setError(data.detail || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setError(`Terjadi kesalahan sistem (${err.message || 'Gagal terhubung'}). Pastikan backend berjalan dan variabel VITE_API_BASE_URL di Vercel terpasang.`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccessMsg(`Instruksi reset password telah dikirim ke Admin HR perusahaan Anda untuk email "${forgotEmail}". Silakan hubungi Admin HR perusahan Anda.`);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans antialiased text-[#1f2937]">
      {/* LEFT PANEL: ONBOARDING ILLUSTRATION (visible on desktop) */}
      <div 
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="hidden lg:flex lg:w-1/2 bg-[#f0f1f3] flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-40 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo at the top left */}
        <div className="flex items-center gap-2.5 z-10">
          <img src="/logo.png" alt="CBN Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl tracking-tight text-[#1e2022]">CBN HRMS</span>
        </div>

        {/* Onboarding Graphic Tailored to Current Slide */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 py-10">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {currentSlide === 0 && (
              /* SLIDE 1: HR Master System */
              <div className="relative w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out">
                {/* Clock background ring */}
                <div className="absolute w-72 h-72 rounded-full border border-dashed border-purple-300 flex items-center justify-center animate-spin" style={{ animationDuration: '50s' }}>
                  <div className="absolute top-0 w-3 h-3 rounded-full bg-[#7b3fe4]"></div>
                </div>
                <div className="absolute w-60 h-60 rounded-full border border-purple-100 bg-purple-50/40"></div>

                {/* Illustration Avatar (with complete arms & hands) */}
                <svg className="w-64 h-64 z-10 drop-shadow-md" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Head */}
                  <circle cx="100" cy="48" r="16" stroke="#1e2022" strokeWidth="3" fill="#fff" />
                  {/* Hair */}
                  <path d="M88 42C88 38 92 34 100 34C108 34 112 38 112 42C112 43.5 109.5 43 106 44C102.5 45 97.5 45 94 44C90.5 43 88 43.5 88 42Z" fill="#1e2022" />
                  {/* Glasses */}
                  <circle cx="94" cy="46" r="4" stroke="#1e2022" strokeWidth="1.5" fill="#fff" />
                  <circle cx="106" cy="46" r="4" stroke="#1e2022" strokeWidth="1.5" fill="#fff" />
                  <line x1="98" y1="46" x2="102" y2="46" stroke="#1e2022" strokeWidth="1.5" />
                  {/* Body / Orange Coat */}
                  <path d="M72 76C72 66 82 62 100 62C118 62 128 66 128 76V136H72V76Z" fill="#ff5f2d" stroke="#1e2022" strokeWidth="3" />
                  {/* White Shirt Collar */}
                  <path d="M92 62L100 74L108 62" stroke="#1e2022" strokeWidth="2" fill="#fff" />
                  
                  {/* Left Arm & Sleeve */}
                  <path d="M72 78 Q56 94 66 112" stroke="#1e2022" strokeWidth="8" strokeLinecap="round" />
                  <path d="M72 78 Q56 94 66 112" stroke="#ff5f2d" strokeWidth="4" strokeLinecap="round" />
                  {/* Left Hand */}
                  <circle cx="66" cy="112" r="4" fill="#fff" stroke="#1e2022" strokeWidth="2" />

                  {/* Right Arm & Sleeve */}
                  <path d="M128 78 Q144 94 134 112" stroke="#1e2022" strokeWidth="8" strokeLinecap="round" />
                  <path d="M128 78 Q144 94 134 112" stroke="#ff5f2d" strokeWidth="4" strokeLinecap="round" />
                  {/* Right Hand */}
                  <circle cx="134" cy="112" r="4" fill="#fff" stroke="#1e2022" strokeWidth="2" />

                  {/* Tablet / Clipboard held by hands */}
                  <rect x="74" y="92" width="52" height="42" rx="4" fill="#fff" stroke="#1e2022" strokeWidth="2.5" />
                  <rect x="90" y="88" width="20" height="6" rx="2" fill="#7b3fe4" />
                  <line x1="82" y1="104" x2="118" y2="104" stroke="#7b3fe4" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="82" y1="114" x2="112" y2="114" stroke="#1e2022" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="82" y1="122" x2="104" y2="122" stroke="#1e2022" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Trousers & Shoes */}
                  <path d="M84 136V176H96V152H104V176H116V136H84Z" fill="#1e2022" />
                  <path d="M80 176H96V182H80V176Z" fill="#fff" stroke="#1e2022" strokeWidth="2" />
                  <path d="M104 176H120V182H104V176Z" fill="#fff" stroke="#1e2022" strokeWidth="2" />
                </svg>

                {/* Float details card UI */}
                <div className="absolute top-2 left-2 bg-white rounded-xl p-3 shadow-lg border border-purple-100 flex flex-col gap-1.5 w-36 animate-bounce" style={{ animationDuration: '3.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#7b3fe4] flex items-center justify-center text-[8px] font-bold text-white">HR</div>
                    <div className="w-16 h-2 rounded bg-gray-200"></div>
                  </div>
                  <div className="w-24 h-2 rounded bg-[#7b3fe4]"></div>
                  <div className="w-14 h-1.5 rounded bg-gray-200"></div>
                </div>
                <div className="absolute bottom-2 right-2 bg-white rounded-xl p-3 shadow-lg border border-purple-100 flex items-center gap-2.5 w-40 animate-bounce" style={{ animationDuration: '4.5s' }}>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <p className="text-[10px] font-extrabold text-gray-800">150+ Karyawan</p>
                    <p className="text-[8px] font-semibold text-emerald-600">Terdaftar Aktif</p>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 1 && (
              /* SLIDE 2: Multi-Role Security & RBAC */
              <div className="relative w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out">
                {/* Glowing Shield Pulsing Ring */}
                <div className="absolute w-64 h-64 rounded-full border-2 border-blue-200 bg-blue-50/50 animate-pulse"></div>
                <div className="absolute w-52 h-52 rounded-full border border-dashed border-blue-400 animate-spin" style={{ animationDuration: '25s' }}></div>

                {/* Shield Graphic SVG */}
                <svg className="w-48 h-48 z-10 drop-shadow-2xl" viewBox="0 0 100 100" fill="none">
                  <path d="M50 10 L85 25 V50 C85 72 50 90 50 90 C50 90 15 72 15 50 V25 L50 10 Z" fill="url(#shieldGrad)" stroke="#1e2022" strokeWidth="2.5" />
                  <circle cx="50" cy="46" r="12" fill="#fff" stroke="#1e2022" strokeWidth="2" />
                  <path d="M46 46 H54 V58 H46 Z" fill="#7b3fe4" />
                  <circle cx="50" cy="43" r="3" fill="#1e2022" />
                  <defs>
                    <linearGradient id="shieldGrad" x1="15" y1="10" x2="85" y2="90">
                      <stop offset="0%" stopColor="#7b3fe4" />
                      <stop offset="100%" stopColor="#3a6bf6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating Animated Security Badges */}
                <div className="absolute top-2 left-0 bg-white rounded-xl py-2 px-3 shadow-lg border border-purple-100 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="text-[10px] font-black text-[#7b3fe4]">Enkripsi Data</span>
                </div>

                <div className="absolute top-10 right-0 bg-white rounded-xl py-2 px-3 shadow-lg border border-blue-100 flex items-center gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-[10px] font-black text-[#3a6bf6]">Role-Based Access</span>
                </div>

                <div className="absolute bottom-2 left-6 bg-white rounded-xl py-2 px-3 shadow-lg border border-emerald-100 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3.5s' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-black text-emerald-600">Proteksi Sistem</span>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              /* SLIDE 3: Multi-Platform (Web & Mobile) */
              <div className="relative w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out">
                {/* Background Radial Glow */}
                <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-orange-100 to-purple-100 opacity-70 animate-pulse"></div>

                {/* Laptop & Mobile Device Graphic */}
                <div className="relative z-10 flex items-end justify-center gap-2">
                  {/* Laptop */}
                  <div className="w-48 bg-white border-2 border-gray-800 rounded-t-xl p-2 shadow-xl flex flex-col items-center">
                    <div className="w-full h-24 bg-gray-900 rounded-lg p-2 flex flex-col gap-1.5 overflow-hidden">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        </div>
                        <span className="text-[6px] text-gray-400 font-mono">web.hrms.com</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-6 bg-[#7b3fe4] rounded"></div>
                        <div className="h-6 bg-[#3a6bf6] rounded"></div>
                        <div className="h-6 bg-orange-400 rounded"></div>
                      </div>
                      <div className="w-full h-8 bg-gray-800 rounded"></div>
                    </div>
                    <div className="w-56 h-2.5 bg-gray-800 rounded-b-md border-t border-gray-700"></div>
                  </div>

                  {/* Smartphone */}
                  <div className="w-20 h-36 bg-gray-900 border-2 border-gray-800 rounded-2xl p-1.5 shadow-2xl relative -ml-6 -mb-2">
                    <div className="w-8 h-1 bg-gray-700 rounded-full mx-auto mb-1"></div>
                    <div className="w-full h-28 bg-gradient-to-b from-purple-600 to-blue-600 rounded-xl p-1.5 flex flex-col justify-between">
                      <div className="text-[7px] text-white font-bold">Mobile HR</div>
                      <div className="bg-white/20 backdrop-blur-sm rounded p-1 text-[6px] text-white">
                        ✔ Sync Live
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synchronized Sync Badge */}
                <div className="absolute top-2 right-2 bg-white rounded-xl py-2 px-3 shadow-lg border border-orange-100 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="text-[10px] font-black text-orange-600">Realtime Sync</span>
                </div>
              </div>
            )}
          </div>

          {/* Slide Content with animation */}
          <div className="text-center mt-6 px-6 min-h-[120px] flex flex-col items-center justify-center transition-all duration-500 ease-in-out">
            <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider ${SLIDES[currentSlide].badgeColor}`}>
              {SLIDES[currentSlide].badge}
            </span>
            <h2 className="text-2xl font-extrabold text-[#1e2022] leading-tight mb-2 tracking-tight">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
              {SLIDES[currentSlide].subtitle}
            </p>
          </div>

          {/* Interactive Carousel Controls (Dots + Arrows) */}
          <div className="flex items-center gap-4 mt-6 z-20">
            <button
              onClick={handlePrevSlide}
              className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-all cursor-pointer hover:scale-110 active:scale-95"
              title="Slide Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === idx 
                      ? 'w-7 h-2 bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6]' 
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Ke Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNextSlide}
              className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-all cursor-pointer hover:scale-110 active:scale-95"
              title="Slide Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center text-xs text-gray-400 z-10">
          © {new Date().getFullYear()} PT Cybers Blitz Nusantara. Seluruh hak cipta dilindungi.
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24">
        <div className="w-full max-w-md">
          {/* Logo on Mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <img src="/logo.png" alt="CBN Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl tracking-tight text-[#1e2022]">CBN HRMS</span>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="hidden lg:flex justify-start mb-6">
              <img src="/logo.png" alt="CBN Logo" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#1e2022] mb-1.5 tracking-tight">Selamat Datang Kembali!</h2>
            <p className="text-gray-400 text-sm">Silakan masukkan kredensial akun Anda</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Email
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] outline-none transition-all text-sm placeholder-gray-400 bg-white"
                placeholder="contoh@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] outline-none transition-all text-sm placeholder-gray-400 bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#7b3fe4] focus:ring-[#7b3fe4] w-4 h-4 cursor-pointer" 
                />
                <span className="select-none">Ingat Saya</span>
              </label>
              <button 
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSuccessMsg('');
                  setShowForgotModal(true);
                }} 
                className="text-gray-400 hover:text-[#7b3fe4] font-medium transition-colors cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] hover:opacity-95 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:bg-gray-400 cursor-pointer text-sm shadow-md shadow-blue-500/10"
            >
              {loading ? 'Memproses...' : 'Masuk'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Dengan masuk ke akun, Anda menyetujui <a href="#terms" className="text-[#3b82f6] hover:underline">Syarat Layanan</a> dan <a href="#privacy" className="text-[#3b82f6] hover:underline">Kebijakan Privasi</a> kami
          </p>
        </div>
      </div>

      {/* MODAL LUPA KATA SANDI */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-1.5">Lupa Kata Sandi?</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Untuk alasan keamanan data perusahaan, pemulihan kata sandi dilakukan melalui verifikasi Admin HR perusahaan Anda. Silakan masukkan alamat email akun Anda.
            </p>

            {forgotSuccessMsg ? (
              <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold mb-4 border border-emerald-100 leading-relaxed">
                {forgotSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1.5 text-gray-500 uppercase tracking-wider text-[10px]">Email Terdaftar</label>
                  <input
                    type="email"
                    required
                    placeholder="Masukkan email Anda"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-all hover:opacity-95"
                >
                  Kirim Permintaan Reset
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
