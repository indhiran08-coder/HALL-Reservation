import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Phone, Mail, LogIn, Building2, Users, Shield } from 'lucide-react';

// Validate Indian mobile numbers (10 digits, optional +91 or 0 prefix)
function parsePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null;
}

export default function Login() {
  // 'staff' | 'admin'
  const [tab, setTab] = useState('staff');

  // Staff state
  const [phone, setPhone] = useState('');
  // Admin state
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const { sendPhoneOtp, sendEmailOtp } = useAuth();
  const navigate = useNavigate();

  // ── Staff submit (phone → SMS OTP) ────────────────────────────────────────
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error('Please enter your mobile number'); return; }

    const e164Phone = parsePhone(phone);
    if (!e164Phone) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendPhoneOtp(e164Phone);
      if (error) {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
        return;
      }
      toast.success('OTP sent to your phone via SMS!');
      navigate('/verify-otp', { state: { phone: e164Phone, isRegister: false } });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Admin submit (email → email OTP) ─────────────────────────────────────
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your admin email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendEmailOtp(email.trim().toLowerCase());
      if (error) {
        if (error.message?.includes('not found') || error.message?.includes('not exist') || error.message?.includes('Signups not allowed')) {
          toast.error('No admin account found with this email. Contact your system administrator.');
        } else {
          toast.error(error.message || 'Failed to send OTP. Please try again.');
        }
        return;
      }
      toast.success('OTP sent to your email!');
      navigate('/verify-otp', { state: { email: email.trim().toLowerCase(), isAdmin: true } });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ─── Left Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900
                      flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-blue-600 blur-3xl" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl
                          bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">VCET Hall Reservation</h1>
          <p className="text-primary-200 text-lg">Velalar College of Engineering</p>
          <p className="text-primary-200 text-lg">and Technology</p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Conference Halls', value: '11' },
              { label: 'Departments', value: '10+' },
              { label: 'Booking Time', value: '8AM–8PM' },
              { label: 'Instant Confirm', value: '✓' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-primary-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Login Form ─── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold text-white">VCET Halls</span>
            </div>
          </div>

          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 mt-1">
                {tab === 'staff' ? 'Enter your mobile number to receive a sign-in code via SMS' : 'Enter your admin email to receive a sign-in code'}
              </p>
            </div>

            {/* ── Tab Switch ─────────────────────────────────────────── */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => setTab('staff')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${tab === 'staff'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-4 h-4" />
                Staff Login
              </button>
              <button
                type="button"
                onClick={() => setTab('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${tab === 'admin'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Shield className="w-4 h-4" />
                Admin Login
              </button>
            </div>

            {/* ── Staff Form ──────────────────────────────────────────── */}
            {tab === 'staff' && (
              <form onSubmit={handleStaffSubmit} className="space-y-5">
                <div>
                  <label className="form-label">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm font-medium">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="form-input pl-16"
                      autoComplete="tel"
                      maxLength={15}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">A 6-digit OTP will be sent to this number via SMS</p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <><span className="spinner" /> Sending OTP...</>
                  ) : (
                    <><LogIn className="w-5 h-5" /> Send Sign-In Code</>
                  )}
                </button>
              </form>
            )}

            {/* ── Admin Form ──────────────────────────────────────────── */}
            {tab === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div>
                  <label className="form-label">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@velalarengg.ac.in"
                      className="form-input pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">A 6-digit OTP will be sent to your email inbox</p>
                </div>

                {/* Admin notice */}
                <div className="flex items-start gap-2.5 p-3 bg-amber-900/20 border border-amber-800/40 rounded-xl">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    Admin accounts are pre-configured. Only authorised administrators can sign in here.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                             bg-amber-600 hover:bg-amber-500 text-white font-semibold
                             transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <><span className="spinner" /> Sending OTP...</>
                  ) : (
                    <><Shield className="w-5 h-5" /> Send Admin Code</>
                  )}
                </button>
              </form>
            )}

            <div className="section-divider" />

            <p className="text-center text-slate-400 text-sm">
              {tab === 'staff' ? (
                <>Don't have an account?{' '}
                  <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                    Register here
                  </Link>
                </>
              ) : (
                <span className="text-slate-500">Admin accounts are managed by the system administrator.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
