import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHitProject } from '../api';
import { useNotifications } from '../context/NotificationContext';

const CATEGORIES = ['Residential', 'Commercial', 'Mixed Use'];
const PROPERTY_TYPES = {
  Residential: ['Apartment / Flat', 'Villa', 'Independent House', 'Row House', 'Township', 'Residential Plot', 'Farm House', 'Farm Land', 'Studio Apartment', 'Penthouse', 'Duplex', 'Serviced Apartment', 'Other'],
  Commercial: ['Office Space', 'Retail', 'Showroom', 'Commercial Plot / Land', 'Industry', 'Co-working Space', 'Warehouse / Storage', 'Hospitality', 'Other'],
  'Mixed Use': ['Residential + Retail', 'Residential + Office', 'Residential + Commercial Complex', 'Mixed-Use Tower', 'Mixed-Use Township', 'Integrated Development', 'Other'],
};
const PROJECT_STATUSES = [
  { value: 'pre-launch', label: 'Pre-Launch' },
  { value: 'under-construction', label: 'Under Construction' },
  { value: 'ready-to-move', label: 'Ready to Move' },
];
const ALL_AMENITIES = [
  'Lift', 'Parking', 'Power Backup', 'Gym', 'Swimming Pool', 'Garden', 'Club House', 'Security',
  'Children Play Area', 'Jogging Track', 'Community Hall', 'Fire Safety', 'CCTV Surveillance',
  'Gated Community', 'Visitor Parking', 'Intercom Facility', '24x7 Water Supply',
  'Rain Water Harvesting', 'Sewage Treatment Plant', 'EV Charging Station', 'Indoor Games Room',
  'Outdoor Sports Court', 'Tennis Court', 'Basketball Court', 'Badminton Court',
  'Multipurpose Hall', 'Yoga Deck', 'Senior Citizen Zone', 'Pet Park', 'Library',
];

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm p-6';
const labelClass = 'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';
const inputClass = 'w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all';

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
  const toggleAmenity = (a) => setForm(prev => ({
    ...prev, amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a]
  }));

  const handleSubmit = async (status = 'draft') => {
    if (!form.projectName.trim()) { addToast('Project name is required', 'error'); return; }
    if (!form.category) { addToast('Category is required', 'error'); return; }
    if (!form.city.trim()) { addToast('City is required', 'error'); return; }

    if (status === 'published') {
      if (!form.location.trim()) { addToast('Location / Area is required to publish', 'error'); return; }
      if (!form.propertyType) { addToast('Property Type is required to publish', 'error'); return; }
      if (!form.googleMapLink.trim()) { addToast('Google Map Link is required to publish', 'error'); return; }
      if (!form.startingPrice) { addToast('Starting Price is required to publish', 'error'); return; }
      // BHK required for non-plot, non-mixed types
      const isPlot = (form.propertyType || '').toLowerCase().includes('plot') || (form.propertyType || '').toLowerCase().includes('land');
      const isMixed = form.category === 'Mixed Use';
      if (!isPlot && !isMixed && !form.bhkOptions.trim()) { addToast('BHK Options are required for this property type', 'error'); return; }
      if (form.amenities.length === 0) { addToast('Select at least one amenity', 'error'); return; }
      if (!form.whatsappNumber) { addToast('WhatsApp number is required to publish', 'error'); return; }
      if (!form.callNumber) { addToast('Call number is required to publish', 'error'); return; }
      if (form.reraApproved && !form.reraNumber.trim()) { addToast('RERA Number is required when RERA Approved', 'error'); return; }
    }

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
      addToast(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to create project', 'error');
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Create a project — visible on both OneEmployee and homeintown.in</p>
        </div>
      </div>

      {/* Basic Details */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Basic Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Project Name *</label><input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} className={inputClass} placeholder="e.g., Sunrise Heights" /></div>
          <div><label className={labelClass}>Category *</label><select value={form.category} onChange={e => { set('category', e.target.value); set('propertyType', ''); }} className={inputClass}><option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className={labelClass}>Property Type *</label><select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={inputClass} disabled={!form.category}><option value="">{form.category ? 'Select type' : 'Select category first'}</option>{(PROPERTY_TYPES[form.category] || []).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className={labelClass}>City *</label><input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputClass} placeholder="e.g., Mumbai" /></div>
          <div><label className={labelClass}>Location / Area *</label><input type="text" value={form.location} onChange={e => set('location', e.target.value)} className={inputClass} placeholder="e.g., Andheri West" /></div>
          <div><label className={labelClass}>Google Map Link</label><input type="url" value={form.googleMapLink} onChange={e => set('googleMapLink', e.target.value)} className={inputClass} placeholder="https://maps.google.com/..." /></div>
        </div>
      </div>

      {/* Legal & Status */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Legal & Status</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.reraApproved} onChange={e => set('reraApproved', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" /><span className="text-xs font-bold text-slate-700 dark:text-slate-300">RERA Approved</span></label>
          </div>
          {form.reraApproved && <input type="text" value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} className={inputClass} placeholder="RERA Number" />}
          <div><label className={labelClass}>Project Status</label><div className="flex gap-2 flex-wrap">{PROJECT_STATUSES.map(s => (<button key={s.value} onClick={() => set('projectStatus', s.value)} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${form.projectStatus === s.value ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>{s.label}</button>))}</div></div>
        </div>
      </div>

      {/* Amenities */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Amenities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visibleAmenities.map(a => (<button key={a} onClick={() => toggleAmenity(a)} className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${form.amenities.includes(a) ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>{a}</button>))}
        </div>
        <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="mt-3 text-xs font-bold text-primary hover:underline">{showAllAmenities ? '- Show less' : `+ Show all (${ALL_AMENITIES.length})`}</button>
      </div>

      {/* Configuration */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Configuration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>BHK Options</label><input type="text" value={form.bhkOptions} onChange={e => set('bhkOptions', e.target.value)} className={inputClass} placeholder="1BHK, 2BHK, 3BHK" /></div>
          <div><label className={labelClass}>Carpet Area Range</label><input type="text" value={form.carpetAreaRange} onChange={e => set('carpetAreaRange', e.target.value)} className={inputClass} placeholder="450-1200 sq ft" /></div>
          <div><label className={labelClass}>Plot Size Range</label><input type="text" value={form.plotSizeRange} onChange={e => set('plotSizeRange', e.target.value)} className={inputClass} placeholder="1000-2500 sq ft" /></div>
          <div><label className={labelClass}>Floor Range</label><input type="text" value={form.floorRange} onChange={e => set('floorRange', e.target.value)} className={inputClass} placeholder="G+14" /></div>
        </div>
      </div>

      {/* Pricing */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Starting Price (₹) *</label><input type="number" value={form.startingPrice} onChange={e => set('startingPrice', e.target.value)} className={inputClass} placeholder="8500000" /></div>
          <div><label className={labelClass}>Price Per Sq Ft (₹) *</label><input type="number" value={form.pricePerSqFt} onChange={e => set('pricePerSqFt', e.target.value)} className={inputClass} placeholder="15000" /></div>
          <div><label className={labelClass}>Price Range</label><input type="text" value={form.totalPriceRange} onChange={e => set('totalPriceRange', e.target.value)} className={inputClass} placeholder="85L - 1.5Cr" /></div>
          <div><label className={labelClass}>Payment Plan</label><input type="text" value={form.paymentPlan} onChange={e => set('paymentPlan', e.target.value)} className={inputClass} placeholder="10:80:10" /></div>
        </div>
      </div>

      {/* Contact */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={labelClass}>CTA Button Text</label><input type="text" value={form.ctaButtonText} onChange={e => set('ctaButtonText', e.target.value)} className={inputClass} placeholder="Book Site Visit" /></div>
          <div><label className={labelClass}>WhatsApp *</label><input type="tel" value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} className={inputClass} placeholder="9876543210" /></div>
          <div><label className={labelClass}>Call Number *</label><input type="tel" value={form.callNumber} onChange={e => set('callNumber', e.target.value)} className={inputClass} placeholder="9876543210" /></div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <button onClick={() => navigate('/projects')} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="px-6 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="px-6 py-3 rounded-xl bg-primary text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/25">{saving ? 'Publishing...' : 'Publish'}</button>
        </div>
      </div>
    </div>
  );
}
