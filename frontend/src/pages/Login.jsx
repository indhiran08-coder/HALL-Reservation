import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Phone, LogIn, Building2 } from 'lucide-react';

// Validate Indian mobile numbers (10 digits, optional +91 or 0 prefix)
function parsePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null; // invalid
}

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendPhoneOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
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
        if (error.message?.includes('not found') || error.message?.includes('not exist')) {
          toast.error('No account found with this number. Please register first.');
        } else {
          toast.error(error.message || 'Failed to send OTP');
        }
        return;
      }
      toast.success('OTP sent to your phone via SMS!');
      navigate('/verify-otp', { state: { phone: e164Phone, isRegister: false } });
    } catch (err) {
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 mt-1">Enter your mobile number to receive a sign-in code via SMS</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <><span className="spinner" /> Sending OTP...</>
                ) : (
                  <><LogIn className="w-5 h-5" /> Send Sign-In Code</>
                )}
              </button>
            </form>

            <div className="section-divider" />

            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
