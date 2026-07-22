import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, Building2, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', department: '', email: '', password: '', confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.department) newErrors.department = 'Department is required';
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!form.email.endsWith('@velalarengg.ac.in')) {
      newErrors.email = 'Registration is restricted to official Velalar College email addresses (@velalarengg.ac.in).';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and a number';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Registration successful! Check your email for the OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const emailValid = form.email && form.email.endsWith('@velalarengg.ac.in');
  const emailInvalid = form.email && !form.email.endsWith('@velalarengg.ac.in');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">VCET Hall Reservation</span>
          </div>
          <p className="text-slate-400 text-sm">
            For authorized faculty of Velalar College of Engineering and Technology only
          </p>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-slate-400 mt-1">Register with your college email address</p>
          </div>

          {/* Domain restriction notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-900/30 border border-primary-800/50 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-200">
              Only <strong>@velalarengg.ac.in</strong> email addresses are accepted.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name</label>
              <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                placeholder="e.g. Dr. Arun Kumar" className="form-input" />
              {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="form-label">Department</label>
              <input name="department" type="text" value={form.department} onChange={handleChange}
                placeholder="e.g. Computer Science and Engineering"
                className="form-input" />
              {errors.department && <p className="form-error">⚠ {errors.department}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">College Email</label>
              <div className="relative">
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="yourname@velalarengg.ac.in"
                  className={`form-input pr-10 ${emailInvalid ? 'border-red-500 focus:ring-red-500' : ''} 
                               ${emailValid ? 'border-green-500 focus:ring-green-500' : ''}`} />
                {emailValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>
                )}
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Min. 8 chars, with uppercase & number"
                  className="form-input pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter your password" className="form-input pr-12" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <><span className="spinner" /> Registering...</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Create Account</>
              )}
            </button>
          </form>

          <div className="section-divider" />
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
