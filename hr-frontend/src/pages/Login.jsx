import { API_BASE_URL } from '../utils/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('name', data.name);
        navigate('/');
      } else {
        setError(data.detail || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Tidak dapat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans antialiased text-[#1f2937]">
      {/* LEFT PANEL: ONBOARDING ILLUSTRATION (visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f0f1f3] flex-col justify-between p-12 relative overflow-hidden">
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
        <div className="flex items-center gap-2 z-10">
          <div className="flex gap-1.5 items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L1 22H6L11 2H6Z" fill="#7b3fe4" />
              <path d="M13 2L8 22H13L18 2H13Z" fill="#3a6bf6" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#1e2022]">Workwave</span>
        </div>

        {/* Onboarding Graphic */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 py-10">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Clock background ring */}
            <div className="absolute w-72 h-72 rounded-full border border-dashed border-gray-300 flex items-center justify-center animate-spin" style={{ animationDuration: '60s' }}>
              <div className="absolute top-0 w-2 h-2 rounded-full bg-[#7b3fe4]"></div>
            </div>
            {/* Inner Clock solid ring */}
            <div className="absolute w-60 h-60 rounded-full border border-gray-200 flex items-center justify-center">
              <div className="absolute top-10 right-10 w-3 h-3 rounded-full bg-[#1e2022]"></div>
            </div>

            {/* Illustration Avatar (SVG Drawing of character) */}
            <svg className="w-64 h-64 z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <circle cx="100" cy="50" r="16" stroke="#1e2022" strokeWidth="3" fill="#fff" />
              {/* Hair */}
              <path d="M88 44C88 40 92 36 100 36C108 36 112 40 112 44C112 45.5 109.5 45 106 46C102.5 47 97.5 47 94 46C90.5 45 88 45.5 88 44Z" fill="#1e2022" />
              {/* Glasses */}
              <circle cx="94" cy="48" r="4" stroke="#1e2022" strokeWidth="1.5" />
              <circle cx="106" cy="48" r="4" stroke="#1e2022" strokeWidth="1.5" />
              <line x1="98" y1="48" x2="102" y2="48" stroke="#1e2022" strokeWidth="1.5" />
              {/* Body / Coat (Orange) */}
              <path d="M72 80C72 70 82 66 100 66C118 66 128 70 128 80V140H72V80Z" fill="#ff5f2d" stroke="#1e2022" strokeWidth="3" />
              {/* Collar details */}
              <path d="M92 66L100 76L108 66" stroke="#1e2022" strokeWidth="2" fill="#fff" />
              {/* Trousers */}
              <path d="M84 140V180H96V155H104V180H116V140H84Z" fill="#1e2022" />
              {/* Shoes */}
              <path d="M80 180H96V186H80V180Z" fill="#fff" stroke="#1e2022" strokeWidth="2" />
              <path d="M104 180H120V186H104V180Z" fill="#fff" stroke="#1e2022" strokeWidth="2" />
              {/* Clipboard (Hand holding) */}
              <rect x="60" y="90" width="24" height="32" rx="2" fill="#fff" stroke="#1e2022" strokeWidth="2" transform="rotate(-15, 72, 106)" />
              <line x1="64" y1="102" x2="76" y2="98" stroke="#7b3fe4" strokeWidth="2" />
              <line x1="62" y1="108" x2="74" y2="104" stroke="#1e2022" strokeWidth="1.5" />
              <line x1="60" y1="114" x2="72" y2="110" stroke="#1e2022" strokeWidth="1.5" />
              {/* Umbrella (holding) */}
              <path d="M136 100V160" stroke="#1e2022" strokeWidth="3" />
              <path d="M136 160C136 164 140 164 142 164C144 164 144 160 144 160" stroke="#1e2022" strokeWidth="3" fill="none" />
              <path d="M128 100C128 92 144 92 144 100H128Z" fill="#7b3fe4" stroke="#1e2022" strokeWidth="2" />
            </svg>

            {/* Float details card UI in background */}
            <div className="absolute top-2 left-2 bg-white rounded-lg p-3 shadow-md border border-gray-100 flex flex-col gap-1.5 w-32 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-8 h-2 rounded bg-gray-200"></div>
              <div className="w-16 h-2.5 rounded bg-[#7b3fe4]"></div>
              <div className="w-10 h-2 rounded bg-gray-200"></div>
            </div>
            <div className="absolute bottom-2 right-2 bg-white rounded-lg p-3 shadow-md border border-gray-100 flex flex-col gap-1.5 w-36 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                <div className="w-16 h-3 rounded bg-gray-200"></div>
              </div>
              <div className="w-24 h-2 rounded bg-gray-100"></div>
            </div>
          </div>

          {/* Heading under illustration */}
          <div className="text-center mt-8 px-6">
            <h2 className="text-2xl font-bold text-[#1e2022] leading-tight mb-2">
              Onboarding New Talent with Digital HRMS
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Everything you need in an easily customizable dashboard
            </p>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center gap-1.5 mt-6">
            <div className="w-7 h-2 rounded-full bg-[#7b3fe4]"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center text-xs text-gray-400 z-10">
          © {new Date().getFullYear()} Workwave Systems. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24">
        <div className="w-full max-w-md">
          {/* Logo on Mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L1 22H6L11 2H6Z" fill="#7b3fe4" />
              <path d="M13 2L8 22H13L18 2H13Z" fill="#3a6bf6" />
            </svg>
            <span className="font-bold text-xl tracking-tight text-[#1e2022]">Workwave</span>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            {/* Double-slash logo inside the box (matching image 1) */}
            <div className="hidden lg:flex justify-start mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L2 22H8L14 2H8Z" fill="#7b3fe4" />
                <path d="M17 2L11 22H17L23 2H17Z" fill="#3a6bf6" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-[#1e2022] mb-1.5 tracking-tight">Welcome Back !</h2>
            <p className="text-gray-400 text-sm">Please enter your details</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] outline-none transition-all text-sm placeholder-gray-400 bg-white"
                placeholder="admin@hr.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Password
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.895 7.895L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <input type="checkbox" className="rounded border-gray-300 text-[#7b3fe4] focus:ring-[#7b3fe4] w-4 h-4" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="text-gray-400 hover:text-gray-600 font-medium">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] hover:opacity-95 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:bg-gray-400 cursor-pointer text-sm shadow-md shadow-blue-500/10"
            >
              {loading ? 'Processing...' : 'Login'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            By creating an account, you agree to our <a href="#terms" className="text-[#3b82f6] hover:underline">Terms of Service</a> and <a href="#privacy" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
          </p>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <a href="#signup" className="text-[#7b3fe4] font-bold hover:underline">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
