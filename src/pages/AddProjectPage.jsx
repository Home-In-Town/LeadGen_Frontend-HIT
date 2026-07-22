import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHitProject } from '../api';
import { useNotifications } from '../context/NotificationContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Residential', 'Commercial', 'Mixed Use'];

const PROPERTY_TYPES = {
  Residential: ['Flat / Apartment', 'Plot', 'Villa', 'Row House', 'Penthouse', 'Duplex', 'Studio', 'Farm House'],
  Commercial: ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Commercial Land'],
  'Mixed Use': ['Mixed Development', 'IT Park', 'SEZ'],
};

const PROJECT_STATUSES = [
  { value: 'pre-launch', label: 'Pre-Launch', icon: '🚀' },
  { value: 'under-construction', label: 'Under Construction', icon: '🏗️' },
  { value: 'ready-to-move', label: 'Ready to Move', icon: '✅' },
];

const ALL_AMENITIES = [
  'Lift', 'Parking', 'Power Backup', 'Gym', 'Swimming Pool', 'Garden', 'Club House', 'Security',
  'Children Play Area', 'Jogging Track', 'Community Hall', 'Fire Safety', 'CCTV Surveillance',
  'Gated Community', 'Visitor Parking', 'Intercom Facility', '24x7 Water Supply',
  'Rain Water Harvesting', 'Sewage Treatment Plant', 'Waste Management', 'Solar Power',
  'EV Charging Station', 'Indoor Games Room', 'Outdoor Sports Court', 'Tennis Court',
  'Basketball Court', 'Badminton Court', 'Cricket Pitch', 'Multipurpose Hall',
  'Amphitheatre', 'Yoga Deck', 'Meditation Area', 'Senior Citizen Zone', 'Pet Park',
  'Library', 'Business Center', 'Lake View', 'Temple / Prayer Hall', 'Banquet Hall',
  'Concierge Services', 'Car Wash Area', 'Salon / Spa', 'Music Room', 'Dance Studio',
  'Virtual Reality Room', 'Game Zone', 'Arcade', 'Karaoke Room', 'Restaurant / Cafeteria',
  'Pharmacy', 'Medical Center', 'ATM', 'Open Air Theatre', 'Barbeque Area',
];

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm p-6';
const labelClass = 'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';
const inputClass = 'w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all';
const sectionTitle = (num, title) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black">{num}</div>
    <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
  </div>
);

export default function AddProjectPage() {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const [form, setForm] = useState({
    projectName: '', category: '', propertyType: '', city: '', location: '',
    latitude: '', longitude: '', googleMapLink: '',
    reraApproved: false, reraNumber: '', projectStatus: 'pre-launch',
    amenities: [],
    bhkOptions: '', carpetAreaRange: '', plotSizeRange: '', floorRange: '', facingOptions: '', gatedCommunity: false,
    startingPrice: '', pricePerSqFt: '', totalPriceRange: '', paymentPlan: '', bankLoanAvailable: false,
    ctaButtonText: 'Book Site Visit', whatsappNumber: '', callNumber: '',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleAmenity = (a) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };

  const handleSubmit = async (status = 'draft') => {
    if (!form.projectName.trim()) { addToast('Project name is required', 'error'); return; }
    if (!form.category) { addToast('Category is required', 'error'); return; }
    if (!form.city.trim()) { addToast('City is required', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        projectType: form.propertyType || form.category.toLowerCase(),
        category: form.category,
        city: form.city.trim(),
        location: form.location.trim(),
        ...(form.latitude && { latitude: parseFloat(form.latitude) }),
        ...(form.longitude && { longitude: parseFloat(form.longitude) }),
        ...(form.googleMapLink && { googleMapLink: form.googleMapLink.trim() }),
        reraApproved: form.reraApproved,
        ...(form.reraNumber && { reraNumber: form.reraNumber.trim() }),
        projectStatus: form.projectStatus,
        amenities: form.amenities,
        configuration: {
          ...(form.bhkOptions && { bhkOptions: form.bhkOptions.split(',').map(s => s.trim()).filter(Boolean) }),
          ...(form.carpetAreaRange && { carpetAreaRange: form.carpetAreaRange }),
          ...(form.plotSizeRange && { plotSizeRange: form.plotSizeRange }),
          ...(form.floorRange && { floorRange: form.floorRange }),
          ...(form.facingOptions && { facingOptions: form.facingOptions.split(',').map(s => s.trim()).filter(Boolean) }),
          gatedCommunity: form.gatedCommunity,
        },
        pricing: {
          ...(form.startingPrice && { startingPrice: Number(form.startingPrice) }),
          ...(form.pricePerSqFt && { pricePerSqFt: Number(form.pricePerSqFt) }),
          ...(form.totalPriceRange && { totalPriceRange: form.totalPriceRange }),
          ...(form.paymentPlan && { paymentPlan: form.paymentPlan }),
          bankLoanAvailable: form.bankLoanAvailable,
        },
        cta: {
          buttonText: form.ctaButtonText || 'Book Site Visit',
          ...(form.whatsappNumber && { whatsappNumber: form.whatsappNumber }),
          ...(form.callNumber && { callNumber: form.callNumber }),
        },
        status,
      };

      await createHitProject(payload);
      addToast(`Project "${form.projectName}" ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
      navigate('/projects');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const visibleAmenities = showAllAmenities ? ALL_AMENITIES : ALL_AMENITIES.slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-xl text-slate-500">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Add New Project</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Create a project — it will be accessible from both OneEmployee and homeintown.in</p>
        </div>
      </div>

      {/* Section 1: Basic Details */}
      <div className={cardClass}>
        {sectionTitle(1, 'Basic Details')}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Project Name *</label>
            <input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} className={inputClass} placeholder="e.g., Sunrise Heights" />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select value={form.category} onChange={e => { set('category', e.target.value); set('propertyType', ''); }} className={inputClass}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Property Type *</label>
            <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={inputClass} disabled={!form.category}>
              <option value="">{form.category ? 'Select type' : 'Select a category first'}</option>
              {(PROPERTY_TYPES[form.category] || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputClass} placeholder="e.g., Mumbai" />
          </div>
          <div>
            <label className={labelClass}>Location / Area *</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} className={inputClass} placeholder="e.g., Andheri West" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelClass}>Latitude</label><input type="text" value={form.latitude} onChange={e => set('latitude', e.target.value)} className={inputClass} placeholder="e.g., 19.0760" /></div>
            <div><label className={labelClass}>Longitude</label><input type="text" value={form.longitude} onChange={e => set('longitude', e.target.value)} className={inputClass} placeholder="e.g., 72.8777" /></div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Google Map Link</label>
            <input type="url" value={form.googleMapLink} onChange={e => set('googleMapLink', e.target.value)} className={inputClass} placeholder="https://maps.google.com/..." />
          </div>
        </div>
      </div>

      {/* Section 2: Legal & Trust */}
      <div className={cardClass}>
        {sectionTitle(2, 'Legal & Trust')}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>RERA Approved</label>
            <div className="flex gap-2">
              <button onClick={() => set('reraApproved', true)} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.reraApproved ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                ✓ Yes
              </button>
              <button onClick={() => set('reraApproved', false)} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${!form.reraApproved ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                ✗ No
              </button>
            </div>
            {form.reraApproved && (
              <input type="text" value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} className={`${inputClass} mt-2`} placeholder="RERA Registration Number" />
            )}
          </div>
          <div>
            <label className={labelClass}>Project Status</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_STATUSES.map(s => (
                <button key={s.value} onClick={() => set('projectStatus', s.value)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${form.projectStatus === s.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Amenities */}
      <div className={cardClass}>
        {sectionTitle(3, 'Amenities')}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visibleAmenities.map(a => (
            <button key={a} onClick={() => toggleAmenity(a)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                form.amenities.includes(a)
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary font-bold'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}>
              {a}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="mt-3 text-xs font-bold text-primary hover:underline">
          {showAllAmenities ? '- Show less' : `+ See more (${ALL_AMENITIES.length - 10} more)`}
        </button>
        {form.amenities.length > 0 && (
          <p className="mt-2 text-[10px] text-slate-500">{form.amenities.length} selected</p>
        )}
      </div>

      {/* Section 4: Configuration */}
      <div className={cardClass}>
        {sectionTitle(4, 'Configuration')}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>BHK Options</label><input type="text" value={form.bhkOptions} onChange={e => set('bhkOptions', e.target.value)} className={inputClass} placeholder="e.g., 1BHK, 2BHK, 3BHK" /></div>
          <div><label className={labelClass}>Carpet Area Range</label><input type="text" value={form.carpetAreaRange} onChange={e => set('carpetAreaRange', e.target.value)} className={inputClass} placeholder="e.g., 450-1200 sq ft" /></div>
          <div><label className={labelClass}>Plot Size Range</label><input type="text" value={form.plotSizeRange} onChange={e => set('plotSizeRange', e.target.value)} className={inputClass} placeholder="e.g., 1000-2500 sq ft" /></div>
          <div><label className={labelClass}>Floor Range</label><input type="text" value={form.floorRange} onChange={e => set('floorRange', e.target.value)} className={inputClass} placeholder="e.g., G+14" /></div>
          <div><label className={labelClass}>Facing Options</label><input type="text" value={form.facingOptions} onChange={e => set('facingOptions', e.target.value)} className={inputClass} placeholder="e.g., North, East, South" /></div>
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.gatedCommunity} onChange={e => set('gatedCommunity', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Gated Community</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 5: Pricing & Payment */}
      <div className={cardClass}>
        {sectionTitle(5, 'Pricing & Payment')}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Starting Price (₹) *</label><input type="number" value={form.startingPrice} onChange={e => set('startingPrice', e.target.value)} className={inputClass} placeholder="e.g., 8500000" /></div>
          <div><label className={labelClass}>Price Per Sq Ft (₹) *</label><input type="number" value={form.pricePerSqFt} onChange={e => set('pricePerSqFt', e.target.value)} className={inputClass} placeholder="e.g., 15000" /></div>
          <div><label className={labelClass}>Price Range</label><input type="text" value={form.totalPriceRange} onChange={e => set('totalPriceRange', e.target.value)} className={inputClass} placeholder="e.g., 85L - 1.5Cr" /></div>
          <div><label className={labelClass}>Payment Plan</label><input type="text" value={form.paymentPlan} onChange={e => set('paymentPlan', e.target.value)} className={inputClass} placeholder="e.g., 10:80:10 or Flexible" /></div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Bank Loan Available</label>
            <div className="flex gap-2">
              <button onClick={() => set('bankLoanAvailable', true)} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.bankLoanAvailable ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                ✓ Yes
              </button>
              <button onClick={() => set('bankLoanAvailable', false)} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${!form.bankLoanAvailable ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                ✗ No
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Media — placeholder (upload needs R2/S3 integration) */}
      <div className={cardClass}>
        {sectionTitle(6, 'Media & Brochure')}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 block">image</span>
            <p className="text-xs text-slate-500">Cover Image (JPG/PNG, Max 500KB)</p>
            <p className="text-[10px] text-slate-400 mt-1">Image upload will be available after project creation via HomeInTown dashboard</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-xl text-slate-400">photo_library</span>
              <p className="text-[10px] text-slate-400 mt-1">Gallery Images</p>
            </div>
            <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-xl text-slate-400">videocam</span>
              <p className="text-[10px] text-slate-400 mt-1">Project Videos</p>
            </div>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">info</span>
            Upload media via homeintown.in after creating the project here
          </p>
        </div>
      </div>

      {/* Section 7: Contact Configuration */}
      <div className={cardClass}>
        {sectionTitle(7, 'Contact Configuration')}
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={labelClass}>CTA Button Text *</label><input type="text" value={form.ctaButtonText} onChange={e => set('ctaButtonText', e.target.value)} className={inputClass} placeholder="Book Site Visit" /></div>
          <div><label className={labelClass}>WhatsApp Number *</label><input type="tel" value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} className={inputClass} placeholder="e.g., 9876543210" /></div>
          <div><label className={labelClass}>Call Number *</label><input type="tel" value={form.callNumber} onChange={e => set('callNumber', e.target.value)} className={inputClass} placeholder="e.g., 9876543210" /></div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <button onClick={() => navigate('/projects')} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button onClick={() => handleSubmit('draft')} disabled={saving}
            className="px-6 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSubmit('published')} disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/25">
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
