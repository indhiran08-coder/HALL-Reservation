import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, LogIn, Building2, Users, Shield } from 'lucide-react';

const COLLEGE_DOMAIN = 'velalarengg.ac.in';

/** Returns true only for @velalarengg.ac.in addresses */
function isCollegeEmail(email) {
  return email.toLowerCase().trim().endsWith(`@${COLLEGE_DOMAIN}`);
}

export default function Login() {
  const [tab, setTab] = useState('staff'); // 'staff' | 'admin'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendEmailOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      toast.error('Please enter your email address');
      return;
    }

    // Staff must use college domain
    if (tab === 'staff' && !isCollegeEmail(trimmed)) {
      toast.error(`Only @${COLLEGE_DOMAIN} email addresses are accepted for staff login`);
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // shouldCreateUser: false — account must already exist (registered)
      const { error } = await sendEmailOtp(trimmed, false);
      if (error) {
        if (
          error.message?.includes('not found') ||
          error.message?.includes('not exist') ||
          error.message?.includes('Signups not allowed')
        ) {
          toast.error(
            tab === 'staff'
              ? 'No account found. Please register first.'
              : 'No admin account found. Contact your system administrator.'
          );
        } else {
          toast.error(error.message || 'Failed to send OTP. Please try again.');
        }
        return;
      }

      toast.success('OTP sent to your email inbox!');
      navigate('/verify-otp', {
        state: {
          email: trimmed,
          isRegister: false,
          isAdmin: tab === 'admin',
        },
      });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = tab === 'staff';

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
                {isStaff
                  ? `Sign in with your @${COLLEGE_DOMAIN} email`
                  : 'Admin sign-in — enter your configured email'}
              </p>
            </div>

            {/* ── Tab Switch ── */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => { setTab('staff'); setEmail(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                            text-sm font-medium transition-all duration-200
                            ${isStaff
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                              : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-4 h-4" />
                Staff Login
              </button>
              <button
                type="button"
                onClick={() => { setTab('admin'); setEmail(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                            text-sm font-medium transition-all duration-200
                            ${!isStaff
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                              : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Shield className="w-4 h-4" />
                Admin Login
              </button>
            </div>

            {/* ── Shared email form ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">
                  {isStaff ? 'College Email' : 'Admin Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={isStaff
                      ? `yourname@${COLLEGE_DOMAIN}`
                      : 'admin@velalarengg.ac.in'}
                    className="form-input pl-10"
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Staff domain hint */}
                {isStaff && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Only <span className="text-primary-400 font-medium">@{COLLEGE_DOMAIN}</span> addresses are accepted
                  </p>
                )}
              </div>

              {/* Admin notice */}
              {!isStaff && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-900/20 border border-amber-800/40 rounded-xl">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    Admin accounts are pre-configured. Only authorised administrators can sign in here.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                            font-semibold text-white transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            ${isStaff
                              ? 'btn-primary'
                              : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'}`}
              >
                {loading ? (
                  <><span className="spinner" /> Sending OTP...</>
                ) : isStaff ? (
                  <><LogIn className="w-5 h-5" /> Send Sign-In Code</>
                ) : (
                  <><Shield className="w-5 h-5" /> Send Admin Code</>
                )}
              </button>
            </form>

            <div className="section-divider" />

            <p className="text-center text-slate-400 text-sm">
              {isStaff ? (
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
