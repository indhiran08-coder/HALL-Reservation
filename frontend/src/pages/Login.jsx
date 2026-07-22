import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, ...userData } = res.data.data;
      login(userData, token);
      toast.success(`Welcome back, ${userData.fullName}!`);
      navigate(userData.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ─── Left Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 
                      flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
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
              { label: 'Conference Halls', value: '5' },
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
              <p className="text-slate-400 mt-1">Sign in to access the reservation system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">College Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="yourname@velalarengg.ac.in"
                  className="form-input"
                  autoComplete="email"
                />
                {errors.email && <p className="form-error">⚠ {errors.email}</p>}
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="form-input pr-12"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="form-error">⚠ {errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <><span className="spinner" /> Signing in...</>
                ) : (
                  <><LogIn className="w-5 h-5" /> Sign In</>
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
