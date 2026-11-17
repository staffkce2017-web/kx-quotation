import React, { useState } from 'react';
import { useAuth, PRESET_USERS, PresetUser, UserRole } from '../context/AuthContext';
import { KXLogo } from './KXLogo';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithPreset } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('SALES');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await signupWithEmail(email, password, name, role);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="p-6 text-center border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex justify-center mb-3">
            <div className="bg-white p-2.5 rounded-xl shadow-md inline-block">
              <KXLogo size="md" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ระบบใบเสนอราคา & ติดตามสถานะงาน
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Knowledge Xchange (KX) Innovation • เข้าสู่ระบบเพื่อเริ่มใช้งาน
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'signin'
                ? 'text-white border-b-2 border-white bg-neutral-900/80'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'signup'
                ? 'text-white border-b-2 border-white bg-neutral-900/80'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ลงทะเบียนผู้ใช้ใหม่ (Sign Up)
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-start gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sale@kxinnovation.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-white text-neutral-900 hover:bg-neutral-200 font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>กำลังเข้าสู่ระบบ...</span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  ชื่อ - นามสกุล หรือชื่อเล่น
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="พจนา (ฝ่ายขาย)"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  อีเมลองค์กร / ส่วนตัว
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@kxinnovation.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  ตำแหน่ง / สิทธิ์การใช้งาน (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-white transition-colors cursor-pointer"
                >
                  <option value="SALES">💼 ฝ่ายขายและประสานงาน (Sales)</option>
                  <option value="ACCOUNTING">📊 ฝ่ายการเงินและบัญชี (Accounting)</option>
                  <option value="ADMIN">👑 ผู้บริหาร / ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>กำลังสร้างบัญชี...</span>
                ) : (
                  <>
                    <span>ลงทะเบียนและเข้าใช้งาน</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Sign-in */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-neutral-500 uppercase tracking-wider">
                หรือเข้าสู่ระบบด้วย
              </span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วยบัญชี Google</span>
            </button>
          </div>

          {/* Quick Team Sign-In (One-click login for KX roles) */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 font-semibold text-neutral-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>เข้าสู่ระบบด่วนสำหรับทีมงาน KX:</span>
              </span>
              <span className="text-[10px] text-neutral-500">คลิกเดียวเข้าได้ทันที</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRESET_USERS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loginWithPreset(preset)}
                  className="flex items-center gap-2 p-2 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className={`w-7 h-7 rounded-full ${preset.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform`}>
                    {preset.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white">
                      {preset.name}
                    </div>
                    <div className="text-[9.5px] text-neutral-400 truncate">
                      {preset.roleLabel.split('/')[0]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="px-6 py-3 bg-neutral-900/80 border-t border-neutral-800 text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>ระบบรักษาความปลอดภัยมาตรฐาน KMUTT & Knowledge Xchange</span>
        </div>
      </div>
    </div>
  );
};
