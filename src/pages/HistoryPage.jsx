import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeads();
  }, []);

  // Reset to page 1 whenever searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchLeads = async () => {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        navigate('/select-role');
        return;
      }
      const user = JSON.parse(currentUserStr);
      const params = { userId: user.id, role: user.role };
      const res = await api.getAllLeads(params);
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClasses = (score) => {
    if (score >= 80) return 'bg-red-50 text-red-600 border-red-200'; // HOT
    if (score >= 50) return 'bg-orange-50 text-orange-600 border-orange-200'; // WARM
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'; // NEW/COLD
  };

  const statusLabel = (score) => {
    if (score >= 80) return 'HOT';
    if (score >= 50) return 'WARM';
    return 'COLD';
  };

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    const phone = (lead.phone_number || '').toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  // Pagination Logic
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-charcoal/40 text-[10px]">Verifying history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-display text-charcoal pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-charcoal p-4 sm:p-5 mb-8 shadow-sm gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
            Qualification History
          </h1>
          <p className="text-charcoal/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Archive of processed leads
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 text-lg">search</span>
          <input
            type="text"
            placeholder="FILTER BY NAME..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-subtle border-2 border-charcoal/5 py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-primary focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {paginatedLeads.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-charcoal/10 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/10 mb-3">history</span>
            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest">No history found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {paginatedLeads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => navigate(`/lead/${lead.id}`)}
                className="bg-white border-2 border-charcoal hover:border-primary p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group cursor-pointer"
              >
                <div className="flex flex-row items-center gap-4 text-left flex-1 w-full overflow-hidden">
                  <div className="bg-surface-subtle p-2 sm:p-3 border border-charcoal/5 group-hover:bg-primary/5 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl text-charcoal/40 group-hover:text-primary">
                      assignment_turned_in
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter mb-0.5 truncate">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <div className="font-mono text-charcoal/40 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 uppercase tracking-tight">
                      <span>{lead.phone_number}</span>
                      <span className="text-[10px] opacity-30">|</span>
                      <span>{new Date(lead.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row items-center gap-4 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-charcoal/5 sm:border-none justify-between sm:justify-end">
                  <div className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase tracking-[0.15em] ${getStatusClasses(lead.score)}`}>
                    {statusLabel(lead.score)} ({lead.score}%)
                  </div>
                  <span className="material-symbols-outlined text-charcoal/20 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border-2 border-charcoal text-[10px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-charcoal cursor-pointer"
          >
            PREV
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 border-2 font-black text-[10px] transition-all cursor-pointer flex items-center justify-center
                ${currentPage === i + 1 ? 'bg-primary border-primary text-white' : 'border-charcoal hover:bg-surface-subtle text-charcoal'}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border-2 border-charcoal text-[10px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-charcoal cursor-pointer"
          >
            NEXT
          </button>
        </div>
      )}

      {/* Simple Stats Footer */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-t-2 border-charcoal/5 pt-8">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-charcoal/30">Archive Density</span>
          <span className="text-xl font-black">{leads.length} Records Total</span>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black uppercase tracking-widest text-charcoal/30">Internal Navigation</span>
          <p className="font-mono text-xs font-bold uppercase">Page {currentPage} of {totalPages || 1}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
