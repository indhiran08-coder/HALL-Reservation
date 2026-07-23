import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hallAPI, bookingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import {
  Building2, CalendarDays, Clock, AlertCircle,
  CheckCircle2, ChevronRight, Info, Sparkles
} from 'lucide-react';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

function formatDisplayTime(t) {
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export default function BookHall() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [halls, setHalls] = useState([]);
  const [form, setForm] = useState({
    hallId: '',
    eventName: '',
    purpose: '',
    bookingDate: searchParams.get('date') || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '11:00',
  });
  const [loading, setLoading] = useState(false);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [conflictInfo, setConflictInfo] = useState(null);
  const [suggestedHalls, setSuggestedHalls] = useState([]);
  const [step, setStep] = useState(1); // 1: Select hall, 2: Fill details

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      const res = await hallAPI.getAll();
      setHalls(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load halls');
    } finally {
      setHallsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setConflictInfo(null);
    setSuggestedHalls([]);
  };

  const selectHall = (hallId) => {
    setForm({ ...form, hallId: String(hallId) });
    setErrors({ ...errors, hallId: '' });
    setConflictInfo(null);
    setSuggestedHalls([]);
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.hallId) newErrors.hallId = 'Please select a hall';
    if (!form.bookingDate) newErrors.bookingDate = 'Date is required';
    else if (form.bookingDate < today) newErrors.bookingDate = 'Date must be today or future';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';
    else if (form.startTime >= form.endTime) newErrors.endTime = 'End time must be after start time';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.eventName.trim()) newErrors.eventName = 'Event name is required';
    if (form.eventName.length > 200) newErrors.eventName = 'Max 200 characters';
    return newErrors;
  };

  const handleNextStep = () => {
    const newErrors = validateStep1();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setConflictInfo(null);
    setSuggestedHalls([]);

    try {
      const payload = {
        hallId: parseInt(form.hallId),
        eventName: form.eventName.trim(),
        purpose: form.purpose.trim(),
        bookingDate: form.bookingDate,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
      };
      await bookingAPI.create(payload);
      toast.success('🎉 Hall booked successfully!');
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Booking failed.';
      if (msg.includes('already booked') || msg.includes('conflict')) {
        setConflictInfo(msg);
        // Load available halls for suggestions
        try {
          const res = await hallAPI.getAvailable(form.bookingDate, form.startTime + ':00', form.endTime + ':00');
          setSuggestedHalls(res.data.data || []);
        } catch { /* ignore */ }
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedHall = halls.find(h => String(h.id) === String(form.hallId));

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-5">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary-400" />
          Book a Hall
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Reserve a conference hall for your event</p>
      </div>

      {/* ─── Step Indicator ─── */}
      <div className="flex items-center gap-2">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all
              ${step === s ? 'bg-primary-600 text-white' :
                step > s ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
                           'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{s}</span>}
              <span className="hidden sm:inline">{s === 1 ? 'Select Hall & Time' : 'Event Details'}</span>
              <span className="sm:hidden">{s === 1 ? 'Hall & Time' : 'Details'}</span>
            </div>
            {s < 2 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Hall + Date + Time ─── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Hall Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" /> Select Hall
            </h2>
            {hallsLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {halls.map(hall => (
                  <button key={hall.id} type="button" onClick={() => selectHall(hall.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 group
                      ${String(form.hallId) === String(hall.id)
                        ? 'border-primary-500 bg-primary-900/30 ring-2 ring-primary-500/30'
                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">{hall.hallName}</p>
                        <p className="text-slate-400 text-sm mt-0.5">📍 {hall.location}</p>
                        {hall.capacity && (
                          <p className="text-slate-500 text-xs mt-1">👥 Capacity: {hall.capacity}</p>
                        )}
                      </div>
                      {String(form.hallId) === String(hall.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {errors.hallId && <p className="form-error mt-2">⚠ {errors.hallId}</p>}
          </div>

          {/* Date & Time */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" /> Date & Time
            </h2>

            {/* Date */}
            <div className="mb-4">
              <label className="form-label">Booking Date</label>
              <input type="date" name="bookingDate" value={form.bookingDate}
                onChange={handleChange} min={today} className="form-input" />
              {errors.bookingDate && <p className="form-error">⚠ {errors.bookingDate}</p>}
            </div>

            {/* Time Selects */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Time</label>
                <select name="startTime" value={form.startTime} onChange={handleChange}
                  className="form-input">
                  {TIME_SLOTS.slice(0, -1).map(t => (
                    <option key={t} value={t}>{formatDisplayTime(t)}</option>
                  ))}
                </select>
                {errors.startTime && <p className="form-error">⚠ {errors.startTime}</p>}
              </div>
              <div>
                <label className="form-label">End Time</label>
                <select name="endTime" value={form.endTime} onChange={handleChange}
                  className="form-input">
                  {TIME_SLOTS.slice(1).filter(t => t > form.startTime).map(t => (
                    <option key={t} value={t}>{formatDisplayTime(t)}</option>
                  ))}
                </select>
                {errors.endTime && <p className="form-error">⚠ {errors.endTime}</p>}
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-slate-800/60 text-slate-400 text-sm">
              <Info className="w-4 h-4 flex-shrink-0 text-primary-400" />
              Bookings are allowed between <strong className="text-slate-200">8:00 AM</strong> and{' '}
              <strong className="text-slate-200">8:00 PM</strong>
            </div>
          </div>

          <button onClick={handleNextStep} className="btn-primary w-full">
            Continue to Event Details <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ─── Step 2: Event Details ─── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Summary */}
          <div className="card border border-primary-800/40 bg-primary-900/10">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Booking Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-slate-500">Hall</p>
                <p className="text-white font-semibold">{selectedHall?.hallName}</p>
                <p className="text-slate-400 text-xs">{selectedHall?.location}</p>
              </div>
              <div>
                <p className="text-slate-500">Date</p>
                <p className="text-white font-semibold">
                  {format(new Date(form.bookingDate), 'EEEE, MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Time</p>
                <p className="text-white font-semibold">
                  {formatDisplayTime(form.startTime)} – {formatDisplayTime(form.endTime)}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setStep(1)}
              className="text-primary-400 text-sm mt-3 hover:text-primary-300 transition-colors">
              ← Change hall or time
            </button>
          </div>

          {/* Event Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>

            <div className="space-y-4">
              <div>
                <label className="form-label">Event Name *</label>
                <input type="text" name="eventName" value={form.eventName}
                  onChange={handleChange} placeholder="e.g., Department Meeting, AI Workshop"
                  className="form-input" maxLength={200} />
                {errors.eventName && <p className="form-error">⚠ {errors.eventName}</p>}
              </div>

              <div>
                <label className="form-label">Purpose / Description</label>
                <textarea name="purpose" value={form.purpose} onChange={handleChange}
                  placeholder="Brief description of the event (optional)"
                  rows={3} className="form-input resize-none" maxLength={1000} />
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl text-sm text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                Booking will be made for: <strong className="text-slate-200 ml-1">{user?.department}</strong>
              </div>
            </div>
          </div>

          {/* ─── Conflict Error + Smart Suggestions ─── */}
          {conflictInfo && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-medium">Booking Conflict</p>
                  <p className="text-red-400 text-sm mt-1">{conflictInfo}</p>
                </div>
              </div>

              {suggestedHalls.length > 0 && (
                <div className="card border border-yellow-800/40 bg-yellow-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-yellow-300 font-semibold">Smart Suggestions</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    These halls are available for your selected date and time:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {suggestedHalls.map(hall => (
                      <button key={hall.id} type="button"
                        onClick={() => { selectHall(hall.id); setConflictInfo(null); setSuggestedHalls([]); }}
                        className="p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/40 
                                   hover:border-yellow-500/60 text-left transition-all group">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium text-sm">{hall.hallName}</p>
                            <p className="text-slate-400 text-xs">{hall.location}</p>
                          </div>
                          <span className="badge-green text-xs">Available</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <><span className="spinner" /> Booking...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Confirm Booking</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
