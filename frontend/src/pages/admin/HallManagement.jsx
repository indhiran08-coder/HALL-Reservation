import { useState, useEffect } from 'react';
import { hallAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit3, Trash2, X, Save, CheckCircle, XCircle } from 'lucide-react';

const emptyForm = { hallName: '', location: '', description: '' };

export default function HallManagement() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHall, setEditHall] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadHalls(); }, []);

  const loadHalls = async () => {
    try {
      const res = await hallAPI.getAllAdmin();
      setHalls(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditHall(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (hall) => {
    setEditHall(hall);
    setForm({
      hallName: hall.hallName,
      location: hall.location || '',
      description: hall.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hallName.trim()) { toast.error('Hall name is required'); return; }
    if (!form.location.trim()) { toast.error('Location is required'); return; }

    setSubmitting(true);
    try {
      const payload = {
        hallName: form.hallName.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
      };

      if (editHall) {
        await hallAPI.update(editHall.id, payload);
        toast.success('Hall updated successfully!');
      } else {
        await hallAPI.create(payload);
        toast.success('Hall created successfully!');
      }
      setShowModal(false);
      loadHalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await hallAPI.delete(id);
      toast.success('Hall deactivated.');
      setDeleteId(null);
      loadHalls();
    } catch (err) {
      toast.error('Failed to deactivate hall.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary-400" /> Hall Management
          </h1>
          <p className="page-subtitle">Add, edit, and manage conference halls</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-5 h-5" /> Add New Hall
        </button>
      </div>

      {/* ─── Halls Grid ─── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {halls.map(hall => (
            <div key={hall.id}
              className={`card border transition-all duration-200
                ${hall.isActive ? 'border-slate-700 hover:border-slate-500' : 'border-slate-800 opacity-60'}`}>
              {/* Status bar */}
              <div className={`h-1 rounded-full mb-4 ${hall.isActive ? 'bg-gradient-to-r from-primary-500 to-blue-500' : 'bg-slate-700'}`} />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{hall.hallName}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
                    📍 {hall.location}
                  </p>
                </div>
                {hall.isActive
                  ? <span className="badge-green"><CheckCircle className="w-3.5 h-3.5" />Active</span>
                  : <span className="badge-red"><XCircle className="w-3.5 h-3.5" />Inactive</span>}
              </div>

              {hall.description && (
                <p className="text-slate-500 text-sm mb-3 line-clamp-2">{hall.description}</p>
              )}


              {hall.isActive && (
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button onClick={() => openEdit(hall)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(hall.id)}
                    className="flex-1 btn-danger text-sm py-2 flex items-center justify-center gap-1.5">
                    <Trash2 className="w-4 h-4" /> Deactivate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-400" />
                {editHall ? 'Edit Hall' : 'Add New Hall'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Hall Name *</label>
                <input type="text" value={form.hallName}
                  onChange={e => setForm({ ...form, hallName: e.target.value })}
                  placeholder="e.g., Seminar Hall" className="form-input" />
              </div>
              <div>
                <label className="form-label">Location / Floor *</label>
                <input type="text" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Ground Floor, Second Floor" className="form-input" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={form.description} rows={3}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the hall" className="form-input resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <><span className="spinner" /> Saving...</> :
                    <><Save className="w-4 h-4" /> {editHall ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Deactivate Confirm Modal ─── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Deactivate Hall?</h3>
              <p className="text-slate-400 text-sm mb-6">
                This hall will no longer be available for bookings. Existing bookings are preserved.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Keep Active</button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 
                             bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
                  {deleting ? <><span className="spinner" /> Deactivating...</> : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
