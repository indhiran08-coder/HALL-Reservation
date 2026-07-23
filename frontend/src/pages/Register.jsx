import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Building2, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', department: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { sendRegisterOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.department.trim()) newErrors.department = 'Department is required';
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!form.email.endsWith('@velalarengg.ac.in')) {
      newErrors.email = 'Only @velalarengg.ac.in email addresses are accepted.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const { error } = await sendRegisterOtp({
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        department: form.department.trim(),
      });
      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          toast.error('This email is already registered. Please log in.');
          navigate('/login');
        } else {
          toast.error(error.message || 'Registration failed');
        }
        return;
      }
      toast.success('OTP sent! Check your email to complete registration.');
      navigate('/verify-otp', { state: { email: form.email, mode: 'register' } });
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
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
            <p className="text-slate-400 mt-1">Register with your college email — no password needed!</p>
          </div>

          {/* Domain restriction notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-900/30 border border-primary-800/50 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-200">
              Only <strong>@velalarengg.ac.in</strong> email addresses are accepted.
              You'll receive a one-time code to verify your email.
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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <><span className="spinner" /> Sending OTP...</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Register & Send OTP</>
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
