import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, hallAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CalendarDays, Clock, CheckCircle, XCircle, Edit3,
  Trash2, X, Save, Building2, Filter
} from 'lucide-react';

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];
const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'
];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [editBooking, setEditBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookRes, hallRes] = await Promise.all([
        bookingAPI.getMyBookings(),
        hallAPI.getAll(),
      ]);
      setBookings(bookRes.data.data || []);
      setHalls(hallRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return b.status === 'APPROVED' && b.bookingDate >= today;
    if (activeTab === 'Completed') return b.status === 'APPROVED' && b.bookingDate < today;
    if (activeTab === 'Cancelled') return b.status === 'CANCELLED';
    return true;
  });

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = (booking) => {
    setEditBooking(booking);
    setEditForm({
      hallId: String(booking.hallId),
      eventName: booking.eventName,
      purpose: booking.purpose || '',
      bookingDate: booking.bookingDate,
      startTime: booking.startTime?.slice(0, 5),
      endTime: booking.endTime?.slice(0, 5),
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.eventName.trim()) { toast.error('Event name is required'); return; }
    if (editForm.startTime >= editForm.endTime) { toast.error('End time must be after start time'); return; }

    setEditLoading(true);
    try {
      await bookingAPI.update(editBooking.id, {
        hallId: parseInt(editForm.hallId),
        eventName: editForm.eventName,
        purpose: editForm.purpose,
        bookingDate: editForm.bookingDate,
        startTime: editForm.startTime + ':00',
        endTime: editForm.endTime + ':00',
      });
      toast.success('Booking updated successfully!');
      setEditBooking(null);
      loadData();
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Update failed.';
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    setCancelLoading(true);
    try {
      await bookingAPI.cancel(id);
      toast.success('Booking cancelled.');
      setCancelId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── Tab counts ────────────────────────────────────────────────────────────
  const tabCounts = {
    All: bookings.length,
    Upcoming: bookings.filter(b => b.status === 'APPROVED' && b.bookingDate >= today).length,
    Completed: bookings.filter(b => b.status === 'APPROVED' && b.bookingDate < today).length,
    Cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary-400 flex-shrink-0" /> My Bookings
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Manage your hall reservations</p>
        </div>
        <button onClick={() => navigate('/book')} className="btn-primary text-sm py-2 px-3 flex-shrink-0">
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">New Booking</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1
                      scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium
              transition-all duration-200 flex-shrink-0 border
              ${activeTab === tab
                ? 'bg-primary-600 text-white border-primary-500 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 border-slate-700 bg-slate-900'}`}>
            {tab}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${activeTab === tab ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Bookings List ─── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No {activeTab.toLowerCase()} bookings</p>
          {activeTab !== 'Cancelled' && (
            <button onClick={() => navigate('/book')} className="btn-primary mt-4 mx-auto">
              Book a Hall
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => {
            const isPast = booking.bookingDate < today;
            const canEdit = booking.status === 'APPROVED' && !isPast;

            return (
              <div key={booking.id}
                className={`card border transition-all duration-200
                  ${booking.status === 'CANCELLED' ? 'opacity-60 border-slate-800' :
                    isPast ? 'border-slate-700' : 'border-slate-700 hover:border-slate-500'}`}>

                {/* ─ Top: title + badge ─ */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-semibold text-white leading-snug flex-1 min-w-0 truncate">
                    {booking.eventName}
                  </h3>
                  <div className="flex-shrink-0">
                    {booking.status === 'APPROVED' && !isPast && <span className="badge-green">Confirmed</span>}
                    {booking.status === 'APPROVED' && isPast && <span className="badge-blue">Done</span>}
                    {booking.status === 'CANCELLED' && <span className="badge-red">Cancelled</span>}
                  </div>
                </div>

                {/* ─ Info rows ─ */}
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                    <span className="truncate">{booking.hallName}</span>
                    <span className="text-slate-600 text-xs">({booking.hallLocation})</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CalendarDays className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                    <span>{format(new Date(booking.bookingDate), 'EEE, MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                    <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                  </div>
                  {booking.purpose && (
                    <p className="text-slate-500 text-xs italic pl-5">"{booking.purpose}"</p>
                  )}
                </div>

                {/* ─ Actions ─ */}
                {canEdit && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button onClick={() => startEdit(booking)}
                      className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => setCancelId(booking.id)}
                      className="flex-1 btn-danger flex items-center justify-center gap-2 text-sm py-2">
                      <Trash2 className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-400" /> Edit Booking
              </h2>
              <button onClick={() => setEditBooking(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Hall</label>
                <select name="hallId" value={editForm.hallId} onChange={handleEditChange} className="form-input">
                  {halls.map(h => <option key={h.id} value={h.id}>{h.hallName} ({h.location})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Event Name</label>
                <input type="text" name="eventName" value={editForm.eventName}
                  onChange={handleEditChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Purpose</label>
                <textarea name="purpose" value={editForm.purpose} rows={2}
                  onChange={handleEditChange} className="form-input resize-none" />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" name="bookingDate" value={editForm.bookingDate}
                  min={today} onChange={handleEditChange} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Time</label>
                  <select name="startTime" value={editForm.startTime} onChange={handleEditChange} className="form-input">
                    {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <select name="endTime" value={editForm.endTime} onChange={handleEditChange} className="form-input">
                    {TIME_SLOTS.slice(1).filter(t => t > editForm.startTime)
                      .map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditBooking(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1">
                  {editLoading ? <><span className="spinner" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirm Modal ─── */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Cancel Booking?</h3>
              <p className="text-slate-400 text-sm mb-6">
                This action cannot be undone. The slot will be released for others.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancelId(null)} className="btn-secondary flex-1">
                  Keep Booking
                </button>
                <button onClick={() => handleCancel(cancelId)} disabled={cancelLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 
                             bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl 
                             transition-all disabled:opacity-50">
                  {cancelLoading ? <><span className="spinner" /> Cancelling...</> : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
