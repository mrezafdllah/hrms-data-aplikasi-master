import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | valid | invalid | success
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMsg('Link reset password tidak valid. Token tidak ditemukan.');
      return;
    }

    const verifyToken = async () => {
      try {
        const cleanBaseUrl = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : '';
        const res = await fetch(`${cleanBaseUrl}/api/verify-reset-token?token=${token}`);
        const data = await res.json();
        if (res.ok && data.status === 'Success') {
          setStatus('valid');
          setUserName(data.name || '');
          setUserEmail(data.email || '');
        } else {
          setStatus('invalid');
          setErrorMsg(data.detail || 'Token tidak valid.');
        }
      } catch (err) {
        setStatus('invalid');
        setErrorMsg('Gagal memverifikasi token. Pastikan server berjalan.');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const cleanBaseUrl = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : '';
      const res = await fetch(`${cleanBaseUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'Success') {
        setStatus('success');
      } else {
        setFormError(data.detail || 'Gagal mereset kata sandi.');
      }
    } catch (err) {
      setFormError('Terjadi kesalahan. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // --- SVG Icons ---
  const LockIcon = () => (
    <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const AlertIcon = () => (
    <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 p-4 font-sans antialiased">
      <div className="w-full max-w-md">
        
        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Memverifikasi Token...</h2>
            <p className="text-xs text-gray-400">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Invalid Token */}
        {status === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
            <div className="flex justify-center mb-5"><AlertIcon /></div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Link Tidak Valid</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer text-sm"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        )}

        {/* Valid Token — Show Reset Form */}
        {status === 'valid' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <LockIcon />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white">Reset Kata Sandi</h2>
              <p className="text-xs text-white/80 mt-1">Buat kata sandi baru untuk akun Anda</p>
            </div>

            {/* Form */}
            <div className="p-8">
              {/* User info */}
              <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3.5 mb-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{userName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-100">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white text-gray-700 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white text-gray-700 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all disabled:opacity-50 text-sm"
                >
                  {loading ? 'Memproses...' : 'Reset Kata Sandi'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs text-gray-400 hover:text-orange-500 font-medium transition-colors cursor-pointer"
                >
                  ← Kembali ke Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
            <div className="flex justify-center mb-5"><CheckIcon /></div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Kata Sandi Berhasil Direset!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Kata sandi Anda telah berhasil diubah. Silakan login menggunakan kata sandi baru Anda.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer text-sm"
            >
              Masuk ke Akun →
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-300 mt-6">
          © 2026 Aplikasi HR — PT Cybers Blitz Nusantara
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
