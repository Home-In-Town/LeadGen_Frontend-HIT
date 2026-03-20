import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';

const LeadAutomationPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Automations & Templates
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStamp, setSelectedDateStamp] = useState(null); // Selected date for adding a template
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newAutomation, setNewAutomation] = useState({
    templateName: '',
    time: '09:00',
    projectId: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/select-role');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchData();
  }, [leadId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lead
      if (leadId) {
        // Find lead from global list since we don't have a single GET lead endpoint exposed right now
        // Normally we'd use a specific endpoint, extracting from full list is a workaround
        const userStr = localStorage.getItem('currentUser');
        const user = JSON.parse(userStr);
        const leadsRes = await api.getAllLeads({ userId: user.id, role: user.role });
        const currentLead = leadsRes.data.find(l => l.id === leadId);
        
        if (!currentLead) {
          throw new Error('Lead not found');
        }
        setLead(currentLead);
        
        // 2. Fetch existing automations for this lead
        const autoRes = await api.getLeadAutomations(leadId);
        if (autoRes.data.success) {
          setAutomations(autoRes.data.data);
        }
      }

      // 3. Fetch templates mapping
      const tplRes = await api.getWhatsappTemplates();
      if (tplRes.data.success) {
        setTemplates(tplRes.data.data);
      }

      // 4. Fetch Projects for dynamic variables
      const projRes = await api.getBuilderProjects();
      if (projRes.data.success) {
        setProjects(projRes.data.data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load automation data.');
    } finally {
      setLoading(false);
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const grid = [];
    let dayCount = 1;
    
    // Create 6 rows for maximum month layout
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null); // Empty cells before 1st of month
        } else if (dayCount > daysInMonth) {
          week.push(null); // Empty cells after last day of month
        } else {
          week.push(new Date(year, month, dayCount));
          dayCount++;
        }
      }
      grid.push(week);
      if (dayCount > daysInMonth) break;
    }
    return grid;
  };

  // Check if a date has automations
  const getAutomationsForDate = (dateObj) => {
    if (!dateObj) return [];
    
    const targetDateStr = dateObj.toISOString().split('T')[0];
    
    return automations.filter(auto => {
      const autoDateStr = new Date(auto.scheduledAt).toISOString().split('T')[0];
      return autoDateStr === targetDateStr;
    });
  };

  // Formatting helpers
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTemplateLabel = (templateName) => {
    const t = templates.find(t => t.id === templateName);
    return t ? t.label : templateName;
  };

  // Actions
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openAddModal = (dateObj) => {
    setSelectedDateStamp(dateObj);
    setNewAutomation({ templateName: '', time: '09:00', projectId: '' });
    setIsModalOpen(true);
  };

  const handleSaveAutomation = async () => {
    if (!newAutomation.templateName || !newAutomation.time || !selectedDateStamp) {
      alert("Please select a template and time.");
      return;
    }

    setIsSaving(true);
    
    // Parse time
    const [hours, minutes] = newAutomation.time.split(':');
    const scheduledAt = new Date(selectedDateStamp);
    scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // Prevent scheduling in the past
    if (scheduledAt < new Date()) {
      alert("Cannot schedule automations in the past.");
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        leadId: leadId || 'global',
        templateName: newAutomation.templateName,
        scheduledAt: scheduledAt.toISOString(),
        createdBy: {
           userId: currentUser.id,
           role: currentUser.role,
           name: currentUser.name
        }
      };

      // Add dynamic button suffix if Virtual View is selected
      if (newAutomation.templateName === 'lead_street_view' && newAutomation.projectId) {
        payload.button_0 = `${newAutomation.projectId}#street`;
      }

      const res = await api.createLeadAutomation(payload);
      
      if (res.data.success) {
        // Add to local state
        setAutomations([...automations, res.data.data]);
        setIsModalOpen(false);
      } else {
        alert(res.data.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving the automation.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (autoId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scheduled message?')) return;
    
    try {
      const res = await api.deleteLeadAutomation(autoId);
      if (res.data.success) {
        setAutomations(automations.filter(a => a._id !== autoId));
      }
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete automation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-charcoal/40 text-[10px]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Generate grid for rendering
  const monthGrid = generateMonthGrid();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="animate-fade-in font-display pb-10 max-w-7xl mx-auto px-6">
      {/* Top Header Section - Re-styled to match reference layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 mb-4 border-b-4 border-[#232121]">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => navigate(-1)}
            className="group text-[10px] font-black uppercase tracking-widest text-[#232121]/40 hover:text-primary transition-colors flex items-center gap-1 mb-2"
          >
            <span className="material-symbols-outlined text-[14px] transition-transform group-hover:-translate-x-1">arrow_back</span>
            Back to Dashboard
          </button>
          
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#232121] leading-none">
              {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </h1>
            {lead && (
              <span className="text-[12px] font-mono font-bold uppercase tracking-tight text-[#232121]/60 px-2 py-0.5 border-2 border-[#232121]/10 rounded-sm">
                LEAD: {lead.first_name} {lead.last_name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-6 md:mt-0">
          {/* "Manage in Calendar" style button */}
          <button className="hidden sm:flex items-center gap-2 bg-white border-2 border-[#232121] px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_#232121] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#232121] transition-all">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Manage in Calendar
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center bg-white border-2 border-[#232121] shadow-[4px_4px_0px_#232121]">
            <button 
              onClick={handlePrevMonth}
              className="p-3 border-r-2 border-[#232121] hover:bg-[#232121] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined block">chevron_left</span>
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-subtle transition-colors"
            >
              Today
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-3 border-l-2 border-[#232121] hover:bg-[#232121] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined block">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-4 border-red-500 text-red-700 p-5 mb-8 font-mono text-sm font-bold uppercase shadow-[6px_6px_0px_#ef4444]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">warning</span>
            {error}
          </div>
        </div>
      )}

      {/* Main Calendar Container - SaaS Minimal Layout */}
      <div className="bg-white border-[1px] border-[#E5E7EB] w-full overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b-[1px] border-[#E5E7EB] bg-[#F9FAFB]">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[11px] font-medium uppercase tracking-wider text-gray-500 border-r-[1px] border-[#E5E7EB] last:border-r-0">
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {monthGrid.flat().map((dateObj, idx) => {
            if (!dateObj) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="bg-gray-50/30 border-r-[1px] border-b-[1px] border-[#E5E7EB] aspect-square"
                />
              );
            }
            
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
            const dayAutomations = getAutomationsForDate(dateObj);
            const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth();
            
            return (
              <div 
                key={dateObj.toISOString()} 
                className={`relative border-r-[1px] border-b-[1px] border-[#E5E7EB] aspect-square group transition-all duration-200 ease-in-out flex flex-col items-center justify-center
                  ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/50'}
                `}
              >
                {/* Date Content - Perfectly Centered */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300
                    ${isToday ? 'bg-[#FF6B6B] text-white' : (isCurrentMonth ? 'text-gray-700' : 'text-gray-300')}
                    ${isToday ? 'font-semibold' : 'font-medium'}
                  `}>
                    <span className="text-[14px] relative z-10">{dateObj.getDate()}</span>
                  </div>

                  {/* Automation Count Indicator (Minimal Dots) */}
                  {dayAutomations.length > 0 && (
                    <div className="absolute -bottom-3 flex gap-1 justify-center">
                      {dayAutomations.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-[#FF6B6B]/40' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Action: Fade-in Plus Button (Top Right) */}
                {!isPast && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openAddModal(dateObj); }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-gray-50 transition-all duration-200 z-20 cursor-pointer focus:outline-none"
                    title="Add Automation"
                  >
                    <span className="material-symbols-outlined text-[16px] text-gray-500 font-light">add</span>
                  </button>
                )}

                {/* Automation Tooltip/Quick View (Subtle overlay) */}
                {dayAutomations.length > 0 && (
                   <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                     {dayAutomations.length} JOBS
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Automation Modal - Refined */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#232121]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white border-4 border-[#232121] shadow-[12px_12px_0px_#232121] max-w-lg w-full flex flex-col overflow-hidden animate-slide-up">
            
            <div className="flex justify-between items-center p-6 border-b-4 border-[#232121] bg-surface-subtle">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-[#232121]">
                  New Automation
                </h3>
                <p className="text-[12px] font-mono font-bold text-[#232121]/60 uppercase flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {selectedDateStamp && selectedDateStamp.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center border-2 border-[#232121] hover:bg-[#232121] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Recipient Card */}
              <div className="bg-[#13ec13]/5 border-2 border-[#232121] p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#232121] text-[#13ec13] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl font-black">person</span>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-[#232121]/40 tracking-widest">Recipient</div>
                  <div className="text-sm font-mono font-bold text-[#232121]">
                    {lead ? `${lead.first_name} ${lead.last_name}` : 'No Lead Selected'}
                  </div>
                  <div className="text-[10px] font-mono text-[#232121]/60">{lead?.phone_number}</div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#232121]">
                    1. Choose Template
                  </label>
                  <div className="relative">
                    <select
                      value={newAutomation.templateName}
                      onChange={(e) => setNewAutomation({...newAutomation, templateName: e.target.value})}
                      className="w-full appearance-none bg-white border-2 border-[#232121] px-4 py-3 text-[11px] font-black uppercase text-[#232121] focus:bg-[#13ec13]/5 focus:outline-none transition-colors"
                    >
                      <option value="" disabled>Select Sequence</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">expand_more</span>
                  </div>
                </div>

                {/* Project Selection Dropdown - Only if Virtual View template is picked */}
                {newAutomation.templateName === 'lead_street_view' && (
                  <div className="space-y-3 animate-fade-in md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">
                      2. Select Project for Virtual View
                    </label>
                    <div className="relative">
                      <select
                        value={newAutomation.projectId}
                        onChange={(e) => setNewAutomation({...newAutomation, projectId: e.target.value})}
                        className="w-full appearance-none bg-white border-2 border-primary px-4 py-3 text-[11px] font-black uppercase text-[#232121] focus:bg-primary/5 focus:outline-none transition-colors"
                      >
                        <option value="" disabled>Select Project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.projectId}>{p.projectName}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">apartment</span>
                    </div>
                    <p className="text-[10px] font-mono text-[#232121]/40 uppercase">This will generate a custom street view link suffix.</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#232121]">
                    {newAutomation.templateName === 'lead_street_view' ? '3. Dispatch Time' : '2. Dispatch Time'}
                  </label>
                  <input 
                    type="time" 
                    value={newAutomation.time}
                    onChange={(e) => setNewAutomation({...newAutomation, time: e.target.value})}
                    className="w-full bg-white border-2 border-[#232121] px-4 py-2.5 text-xl font-mono font-black text-[#232121] focus:bg-[#13ec13]/5 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-surface-subtle p-6 border-t-4 border-[#232121] flex justify-end gap-4 mt-auto">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 border-2 border-[#232121] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[4px_4px_0px_#232121] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAutomation}
                disabled={isSaving || !newAutomation.templateName || !lead}
                className="px-10 py-3 bg-[#13ec13] border-2 border-[#232121] text-[#232121] text-[10px] font-black uppercase tracking-widest hover:bg-[#232121] hover:text-[#13ec13] transition-all shadow-[6px_6px_0px_#232121] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:shadow-none active:translate-x-1 auto:translate-y-1"
              >
                {isSaving ? 'Processing...' : 'Confirm Schedule'}
                {!isSaving && <span className="material-symbols-outlined text-[16px] font-black">rocket_launch</span>}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadAutomationPage;
