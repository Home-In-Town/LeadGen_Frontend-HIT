import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectDetails, updateHitProject } from '../api';
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

export default function EditProjectPage() {
  const { hitProjectId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const [form, setForm] = useState({
    projectName: '', category: '', propertyType: '', city: '', location: '',
    latitude: '', longitude: '', googleMapLink: '',
    reraApproved: false, reraNumber: '', projectStatus: 'pre-launch',
    amenities: [],
    bhkOptions: '', carpetAreaRange: '', plotSizeRange: '', floorRange: '', facingOptions: '', gatedCommunity: false,
    startingPrice: '', pricePerSqFt: '', totalPriceRange: '', paymentPlan: '', bankLoanAvailable: false,
    ctaButtonText: 'Book Site Visit', whatsappNumber: '', callNumber: '',
    status: 'draft',
  });

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await getProjectDetails(hitProjectId);
        const p = res.data?.project || res.data;
        setForm({
          projectName: p.projectName || '',
          category: p.category || '',
          propertyType: p.projectType || p.propertyType || '',
          city: p.city || '',
          location: p.location || '',
          latitude: p.latitude || '',
          longitude: p.longitude || '',
          googleMapLink: p.googleMapLink || '',
          reraApproved: p.reraApproved || false,
          reraNumber: p.reraNumber || '',
          projectStatus: p.projectStatus || 'pre-launch',
          amenities: p.amenities || [],
          bhkOptions: (p.configuration?.bhkOptions || []).join(', '),
          carpetAreaRange: p.configuration?.carpetAreaRange || '',
          plotSizeRange: p.configuration?.plotSizeRange || '',
          floorRange: p.configuration?.floorRange || '',
          facingOptions: (p.configuration?.facingOptions || []).join(', '),
          gatedCommunity: p.configuration?.gatedCommunity || false,
          startingPrice: p.pricing?.startingPrice || '',
          pricePerSqFt: p.pricing?.pricePerSqFt || '',
          totalPriceRange: p.pricing?.totalPriceRange || '',
          paymentPlan: p.pricing?.paymentPlan || '',
          bankLoanAvailable: p.pricing?.bankLoanAvailable || false,
          ctaButtonText: p.cta?.buttonText || 'Book Site Visit',
          whatsappNumber: p.cta?.whatsappNumber || '',
          callNumber: p.cta?.callNumber || '',
          status: p.status || 'draft',
        });
      } catch (err) {
        addToast(err.response?.data?.error || 'Failed to load project', 'error');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [hitProjectId]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleAmenity = (a) => setForm(prev => ({
    ...prev, amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a]
  }));

  const handleSubmit = async (status) => {
    if (!form.projectName.trim()) { addToast('Project name is required', 'error'); return; }
    if (!form.category) { addToast('Category is required', 'error'); return; }
    if (!form.city.trim()) { addToast('City is required', 'error'); return; }

    if (status === 'published') {
      if (!form.location.trim()) { addToast('Location is required to publish', 'error'); return; }
      if (!form.propertyType) { addToast('Property Type is required to publish', 'error'); return; }
      if (!form.startingPrice) { addToast('Starting Price is required to publish', 'error'); return; }
      if (!form.whatsappNumber) { addToast('WhatsApp number is required to publish', 'error'); return; }
      if (!form.callNumber) { addToast('Call number is required to publish', 'error'); return; }
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
        googleMapLink: form.googleMapLink.trim(),
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
          whatsappNumber: form.whatsappNumber,
          callNumber: form.callNumber,
        },
        status,
      };

      await updateHitProject(hitProjectId, payload);
      addToast(`Project updated${status === 'published' ? ' & published' : ''}!`, 'success');
      navigate('/projects');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const visibleAmenities = showAllAmenities ? ALL_AMENITIES : ALL_AMENITIES.slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-xl text-slate-500">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Project</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{form.projectName || 'Update project details'}</p>
        </div>
      </div>

      {/* Basic Details */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Basic Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Project Name *</label><input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Category *</label><select value={form.category} onChange={e => { set('category', e.target.value); set('propertyType', ''); }} className={inputClass}><option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className={labelClass}>Property Type *</label><select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={inputClass} disabled={!form.category}><option value="">Select</option>{(PROPERTY_TYPES[form.category] || []).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className={labelClass}>City *</label><input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Location *</label><input type="text" value={form.location} onChange={e => set('location', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Google Map Link *</label><input type="url" value={form.googleMapLink} onChange={e => set('googleMapLink', e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Legal */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Legal & Status</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.reraApproved} onChange={e => set('reraApproved', e.target.checked)} className="w-4 h-4 rounded" /><span className="text-xs font-bold text-slate-700 dark:text-slate-300">RERA Approved</span></label>
          {form.reraApproved && <input type="text" value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} className={inputClass} placeholder="RERA Number" />}
          <div><label className={labelClass}>Project Status *</label><div className="flex gap-2 flex-wrap">{PROJECT_STATUSES.map(s => (<button key={s.value} type="button" onClick={() => set('projectStatus', s.value)} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${form.projectStatus === s.value ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-white/10 text-slate-600'}`}>{s.label}</button>))}</div></div>
        </div>
      </div>

      {/* Pricing */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Starting Price (₹) *</label><input type="number" value={form.startingPrice} onChange={e => set('startingPrice', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Price Per Sq Ft (₹)</label><input type="number" value={form.pricePerSqFt} onChange={e => set('pricePerSqFt', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Price Range</label><input type="text" value={form.totalPriceRange} onChange={e => set('totalPriceRange', e.target.value)} className={inputClass} placeholder="85L - 1.5Cr" /></div>
          <div><label className={labelClass}>Payment Plan</label><input type="text" value={form.paymentPlan} onChange={e => set('paymentPlan', e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Configuration */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Configuration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>BHK Options</label><input type="text" value={form.bhkOptions} onChange={e => set('bhkOptions', e.target.value)} className={inputClass} placeholder="1BHK, 2BHK, 3BHK" /></div>
          <div><label className={labelClass}>Carpet Area Range</label><input type="text" value={form.carpetAreaRange} onChange={e => set('carpetAreaRange', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Plot Size Range</label><input type="text" value={form.plotSizeRange} onChange={e => set('plotSizeRange', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Floor Range</label><input type="text" value={form.floorRange} onChange={e => set('floorRange', e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Amenities */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Amenities *</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visibleAmenities.map(a => (<button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${form.amenities.includes(a) ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-200 dark:border-white/10 text-slate-600'}`}>{a}</button>))}
        </div>
        <button type="button" onClick={() => setShowAllAmenities(!showAllAmenities)} className="mt-3 text-xs font-bold text-primary hover:underline">{showAllAmenities ? '- Show less' : `+ Show all`}</button>
        {form.amenities.length > 0 && <p className="text-[10px] text-slate-500 mt-1">{form.amenities.length} selected</p>}
      </div>

      {/* Contact */}
      <div className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Contact *</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={labelClass}>CTA Button</label><input type="text" value={form.ctaButtonText} onChange={e => set('ctaButtonText', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>WhatsApp *</label><input type="tel" value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Call *</label><input type="tel" value={form.callNumber} onChange={e => set('callNumber', e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <button onClick={() => navigate('/projects')} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="px-6 py-3 rounded-xl bg-slate-800 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save as Draft'}</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="px-6 py-3 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50">{saving ? 'Publishing...' : 'Update & Publish'}</button>
        </div>
      </div>
    </div>
  );
}
