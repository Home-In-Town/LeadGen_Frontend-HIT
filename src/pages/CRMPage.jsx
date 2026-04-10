import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { getStatusClasses, getStatusLabel, formatTime } from '../utils/leadUtils';

const CRMPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('site'); // site, ads, automation
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAutomationGroup, setSelectedAutomationGroup] = useState(null);
  const itemsPerPage = 10;
  const debounceRef = useRef(null);

  // Debounce search input by 250ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, []);

  // Reset to page 1 whenever search result or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAutomationGroup(null);
  }, [debouncedSearch, activeTab]);

  const fetchLeads = useCallback(async () => {
    try {
      if (!user) return;
      const params = { userId: user.id, role: user.role, limit: 200 };

      const [leadsRes, automationsRes] = await Promise.all([
        api.getAllLeads(params),
        api.getCreatorAutomations(user.id)
      ]);

      // Support both old (array) and new (paginated) response formats
      const leadsData = leadsRes.data;
      setLeads(Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []));

      if (automationsRes.data && automationsRes.data.success) {
        setAutomations(automationsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data for history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // getStatusClasses and getStatusLabel imported from utils/leadUtils.js

  const filteredLeads = useMemo(() => leads.filter(lead => {
    const isAdsLead = ['facebook', 'google'].includes(lead.source);
    if (activeTab === 'automation') return false;
    if (activeTab === 'ads') return isAdsLead;
    if (activeTab === 'site') return !isAdsLead;
    return true;
  }), [leads, activeTab]);

  const searchFilteredLeads = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return filteredLeads.filter(lead => {
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
      const phone = (lead.phone_number || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  }, [filteredLeads, debouncedSearch]);

  // Group automations by lead for Automation Tab
  const groupedAutomations = useMemo(() => {
    const groupsMap = {};
    automations.forEach(auto => {
      if (!groupsMap[auto.leadId]) {
        groupsMap[auto.leadId] = {
          leadId: auto.leadId,
          leadName: auto.leadName,
          automations: []
        };
        const matchingLead = leads.find(l => l.id === auto.leadId);
        if (matchingLead) {
          groupsMap[auto.leadId].phone_number = matchingLead.phone_number;
          groupsMap[auto.leadId].createdAt = matchingLead.createdAt;
        }
      }
      groupsMap[auto.leadId].automations.push(auto);
    });
    return Object.values(groupsMap).sort((a, b) => {
      const latestA = Math.max(...a.automations.map(x => new Date(x.scheduledAt).getTime()));
      const latestB = Math.max(...b.automations.map(x => new Date(x.scheduledAt).getTime()));
      return latestB - latestA;
    });
  }, [automations, leads]);

  const searchFilteredAutomations = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return groupedAutomations.filter(group => {
      const name = (group.leadName || '').toLowerCase();
      const phone = (group.phone_number || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  }, [groupedAutomations, debouncedSearch]);

  // Pagination Logic
  const activeList = activeTab === 'automation' ? searchFilteredAutomations : searchFilteredLeads;
  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = activeList.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-charcoal/40 text-[10px]">Verifying CRM records...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in font-display text-charcoal pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-charcoal p-1.5 sm:p-2 mb-3 sm:mb-4 shadow-sm gap-2">
        <div className="text-center sm:text-left">
          <h1 className="text-sm sm:text-base font-black uppercase tracking-tighter leading-tight">
            Lead Management (CRM)
          </h1>
          <p className="text-charcoal/40 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">
            Archive of processed leads
          </p>
        </div>
        <div className="relative w-full sm:w-48">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-charcoal/30 text-sm">search</span>
          <input
            type="text"
            placeholder="FILTER BY NAME..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-subtle border border-charcoal/10 h-[26px] pl-7 pr-2 text-[8px] font-black uppercase tracking-widest focus:border-primary focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-0.5 mb-3 sm:mb-4 bg-surface-subtle p-0.5 border-2 border-charcoal">
        <button
          onClick={() => {
            setActiveTab('site');
            setCurrentPage(1);
          }}
          className={`flex-1 flex items-center justify-center h-[28px] sm:h-[34px] text-[7px] sm:text-[8px] font-black uppercase tracking-[0.1em] sm:tracking-widest transition-all ${
            activeTab === 'site' 
              ? 'bg-charcoal text-white shadow-md' 
              : 'text-charcoal/40 hover:text-charcoal hover:bg-white/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">language</span>
            Site Leads
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('ads');
            setCurrentPage(1);
          }}
          className={`flex-1 flex items-center justify-center h-[28px] sm:h-[34px] text-[7px] sm:text-[8px] font-black uppercase tracking-[0.1em] sm:tracking-widest transition-all ${
            activeTab === 'ads' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-charcoal/40 hover:text-charcoal hover:bg-white/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">campaign</span>
            Ads Leads
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('automation');
            setCurrentPage(1);
          }}
          className={`flex-1 flex items-center justify-center h-[28px] sm:h-[34px] text-[7px] sm:text-[8px] font-black uppercase tracking-[0.1em] sm:tracking-widest transition-all ${
            activeTab === 'automation' 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'text-charcoal/40 hover:text-charcoal hover:bg-white/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Automation
          </div>
        </button>
      </div>

      {/* Leads / Automations List */}
      <div className="space-y-3">
        {paginatedItems.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-charcoal/10 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/10 mb-3">inventory_2</span>
            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest">No records found in CRM.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {paginatedItems.map((item) => {
              if (activeTab === 'automation') {
                const group = item;
                
                return (
                  <div 
                    key={group.leadId}
                    className="bg-white border-2 border-charcoal hover:border-emerald-500 transition-all flex flex-col group/auto"
                  >
                    {/* Main Row */}
                    <div className="p-1.5 sm:p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-row items-center gap-2 text-left flex-1 w-full overflow-hidden">
                        <div className="bg-emerald-500/10 p-1 sm:p-1.5 border border-emerald-500/20 group-hover/auto:bg-emerald-500/20 transition-colors shrink-0">
                          <span className="material-symbols-outlined text-base sm:text-lg text-emerald-500">
                            quick_reference_all
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="text-[13px] sm:text-[14px] font-black uppercase tracking-tighter truncate leading-tight">
                              {group.leadName || 'Unknown Lead'}
                            </h3>
                            <span className="bg-emerald-500 text-white text-[6.5px] font-black px-1 py-0.5 rounded-sm uppercase tracking-widest">
                              {group.automations.length} Sent
                            </span>
                          </div>
                          <div className="font-mono text-charcoal/40 text-[9px] sm:text-[10px] font-bold flex flex-wrap items-center gap-1 uppercase tracking-tight">
                            <span>{group.phone_number}</span>
                            <span className="text-[8px] opacity-30">|</span>
                            <span>Records Below</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-charcoal/5 sm:border-none justify-between sm:justify-end">
                        <button 
                          onClick={() => navigate(`/lead-automation/${group.leadId}`)}
                          className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                        >
                          Manage
                        </button>
                        <button 
                          onClick={() => setSelectedAutomationGroup(group)}
                          className="px-2 py-1 border border-charcoal text-[8px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-colors"
                        >
                          CRM
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal Lead
              const lead = item;
              return (
                <div 
                  key={lead.id}
                  onClick={() => navigate(`/lead/${lead.id}`)}
                  className="bg-white border-2 border-charcoal hover:border-primary p-1 sm:p-1.5 transition-all flex flex-col sm:flex-row items-center justify-between gap-1 group cursor-pointer"
                >
                <div className="flex flex-row items-center gap-1.5 text-left flex-1 w-full overflow-hidden">
                  <div className="bg-surface-subtle p-1 sm:p-1.5 border border-charcoal/5 group-hover:bg-primary/5 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-base sm:text-lg text-charcoal/40 group-hover:text-primary">
                      assignment_turned_in
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] sm:text-[14px] font-black uppercase tracking-tighter mb-0.5 truncate leading-tight">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <div className="font-mono text-charcoal/40 text-[9px] sm:text-[10px] font-bold flex flex-wrap items-center gap-1 uppercase tracking-tight">
                      <span>{lead.phone_number}</span>
                      <span className="text-[8px] opacity-30">|</span>
                      <span>{new Date(lead.createdAt || Date.now()).toLocaleDateString()}</span>
                      {user?.role === 'admin' && lead.createdBy?.name && (
                        <>
                          <span className="text-[8px] opacity-30">|</span>
                          <span className="text-primary/70 bg-primary/5 px-1 py-0.5 border border-primary/10 rounded-sm">SRC: {lead.createdBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-charcoal/5 sm:border-none justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lead-automation/${lead.id}`);
                      }}
                      className="flex items-center justify-center gap-1 px-1.5 h-[26px] border-[1.5px] border-charcoal text-[8px] font-black uppercase tracking-[0.1em] hover:bg-charcoal hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[10px]">calendar_month</span>
                      Set Automation
                    </button>
                    <div className={`flex items-center justify-center px-1.5 h-[26px] border-[1.5px] text-[8px] font-black uppercase tracking-[0.1em] ${getStatusClasses(lead.score, lead.status)}`}>
                      {getStatusLabel(lead.score, lead.status)} ({lead.score}%)
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-charcoal/20 group-hover:text-primary transition-colors group-hover:translate-x-0.5 duration-300 text-base">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border-2 border-charcoal text-[9px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-charcoal cursor-pointer"
          >
            PREV
          </button>
          
          {(() => {
            const range = [];
            const delta = 1; // Number of siblings on each side
            const totalVisible = 5; // Total numbers to show in sliding window

            if (totalPages <= totalVisible + 2) {
              for (let i = 1; i <= totalPages; i++) range.push(i);
            } else {
              // Always show 1
              range.push(1);

              if (currentPage <= 3) {
                // Near start
                range.push(2, 3, '...', totalPages);
              } else if (currentPage >= totalPages - 2) {
                // Near end
                range.push('...', totalPages - 2, totalPages - 1, totalPages);
              } else {
                // In middle
                range.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
              }
            }

            return range.map((page, i) => (
              page === '...' ? (
                <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center font-black text-charcoal/20 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 border-2 font-black text-[9px] sm:text-[10px] transition-all cursor-pointer flex items-center justify-center
                    ${currentPage === page 
                      ? activeTab === 'site' ? 'bg-charcoal border-charcoal text-white' 
                        : activeTab === 'ads' ? 'bg-primary border-primary text-white'
                        : 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-charcoal hover:bg-surface-subtle text-charcoal'}`}
                >
                  {page}
                </button>
              )
            ));
          })()}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border-2 border-charcoal text-[9px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-charcoal cursor-pointer"
          >
            NEXT
          </button>
        </div>
      )}

      {/* Simple Stats Footer */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-charcoal/5 pt-6">
        <div className="flex flex-col">
          <span className="text-[7px] font-black uppercase tracking-widest text-charcoal/30 text-center sm:text-left">Archive Density</span>
          <span className="text-lg font-black">{filteredLeads.length} Records Found</span>
        </div>
        <div className="text-center sm:text-right">
          <span className="text-[7px] font-black uppercase tracking-widest text-charcoal/30">Internal Navigation</span>
          <p className="font-mono text-[10px] font-bold uppercase">Page {currentPage} of {totalPages || 1}</p>
        </div>
      </div>
    </div>

    {/* Automation History Modal */}
    {selectedAutomationGroup && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
        <div className="bg-white border-2 border-charcoal w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl relative animate-slide-up">
          {/* Modal Header */}
          <div className="p-2 sm:p-3 border-b-2 border-charcoal bg-surface-subtle flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black uppercase tracking-tighter">
                  {selectedAutomationGroup.leadName}
                </h2>
                <span className="bg-emerald-500 text-white text-[6.5px] font-black px-1.2 py-0.5 rounded-sm uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-[8.5px] font-mono font-bold text-charcoal/40 uppercase mt-0.5">
                {selectedAutomationGroup.phone_number} • {selectedAutomationGroup.automations.length} Records
              </p>
            </div>
            <button 
              onClick={() => setSelectedAutomationGroup(null)}
              className="w-7 h-7 border-2 border-charcoal flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group"
            >
              <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform duration-300">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-2 sm:p-3 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-[7.5px] font-black uppercase tracking-widest text-charcoal/40 mb-2.5">Timeline</h3>
            <div className="space-y-4">
              {selectedAutomationGroup.automations.map((auto) => (
                <div key={auto._id || auto.id} className="bg-white border-2 border-charcoal/10 p-1.5 sm:p-2 flex flex-col gap-2 sm:gap-2.5 group/item hover:border-emerald-500/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 flex items-center justify-center shrink-0 border-2 ${
                        auto.status === 'sent' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
                        auto.status === 'failed' ? 'bg-red-50 border-red-200 text-red-600' : 
                        'bg-surface-subtle border-charcoal/10 text-charcoal/40'
                      }`}>
                        <span className="material-symbols-outlined text-lg">
                          {auto.status === 'sent' ? 'done_all' : (auto.status === 'failed' ? 'error' : 'schedule')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-black uppercase text-charcoal flex items-center gap-1 leading-tight">
                          <span className="truncate max-w-[130px]">{auto.templateName.replace(/_/g, ' ')}</span>
                          {auto.button_0 && auto.button_0.includes('#') && (
                            <span className="text-[6.5px] font-mono bg-charcoal text-white px-1 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
                              {auto.button_0.split('#')[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-[8.5px] font-mono text-charcoal/50 uppercase tracking-tight flex flex-wrap gap-1.5 items-center mt-0.5 font-bold">
                          <span className="flex items-center gap-1 shrink-0">
                            <span className="material-symbols-outlined text-sm mb-0.5 text-charcoal/40">schedule</span>
                            {new Date(auto.scheduledAt).toLocaleString()}
                          </span>
                          <span className={`text-[6.5px] font-black px-1 py-0.5 border rounded-sm shrink-0 ${
                            auto.status === 'sent' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' : 'bg-charcoal/5 text-charcoal/40 border-charcoal/10'
                          }`}>
                            {auto.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 pt-1.5 sm:pt-0 sm:border-l sm:border-charcoal/10 sm:pl-4 shrink-0">
                      <div className="flex flex-col min-w-[45px]">
                        <span className="text-[6.5px] font-black text-charcoal/30 uppercase tracking-widest mb-0">Stats</span>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${auto.linkActivity?.opened ? 'bg-emerald-500 animate-pulse' : 'bg-charcoal/20'}`}></div>
                          <span className={`text-[8.5px] font-black uppercase ${auto.linkActivity?.opened ? 'text-emerald-500' : 'text-charcoal/30'}`}>
                            {auto.linkActivity?.opened ? 'Open' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-[35px]">
                        <span className="text-[6.5px] font-black text-charcoal/30 uppercase tracking-widest mb-0">Dur.</span>
                        <span className="text-[8.5px] font-black text-charcoal uppercase">
                          {auto.linkActivity?.timeSpentSeconds ? (auto.linkActivity.timeSpentSeconds >= 60 ? `${Math.floor(auto.linkActivity.timeSpentSeconds / 60)}m` : `${auto.linkActivity.timeSpentSeconds}s`) : '0s'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-1.5 sm:p-2 border-t-2 border-charcoal bg-surface-subtle flex justify-end gap-1.5 shrink-0">
            <button 
              onClick={() => {
                navigate(`/lead-automation/${selectedAutomationGroup.leadId}`);
                setSelectedAutomationGroup(null);
              }}
              className="px-2.5 py-1 bg-charcoal text-white text-[7.5px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[11px]">add_circle</span>
              New
            </button>
            <button 
              onClick={() => setSelectedAutomationGroup(null)}
              className="px-2.5 py-1 border-2 border-charcoal text-[7.5px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default CRMPage;
