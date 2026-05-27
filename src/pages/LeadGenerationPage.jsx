import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";
import WhatsAppSection from "../components/lead/WhatsAppSection";
import VoiceCallSection from "../components/lead/VoiceCallSection";
import LinkActivitySection from "../components/lead/LinkActivitySection";
import { getChatMessages } from "../api";

const LeadGenerationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, addToast } = useNotifications();
  const { user } = useAuth();

  const [leadData, setLeadData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateType, setLastUpdateType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const refreshData = useCallback(async () => {
    if (!id) return;

    try {
      setIsRefreshing(true);
      const res = await api.getSummary(id);
      setLeadData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load lead data");
    } finally {
      setIsRefreshing(false);
    }
  }, [id]);

  const refreshCallStatus = useCallback(async () => {
    if (!id) return;

    try {
      setIsRefreshing(true);
      await api.getCallStatus(id);
      await refreshData();
    } catch (err) {
      console.error("Failed to refresh call status:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, refreshData]);

    const fetchWhatsAppMessages = useCallback(async () => {
    if (!id) return;

    try {
      const res = await getChatMessages(id);

      const messages = res.data?.data || res.data || [];

      setChatMessages(messages);
    } catch (err) {
      console.error("Failed to fetch WhatsApp messages:", err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      refreshData();
      fetchWhatsAppMessages();

      if (!socket) return;

      const setupLiveConnection = () => {
        console.log("🔌 Connected to real-time server (lead channel)");
        setIsConnected(true);
        socket.emit("join_lead", id);
      };

      if (socket.connected) {
        setupLiveConnection();
      }

      socket.on("connect", setupLiveConnection);

      const handleDisconnect = () => {
        console.log("❌ Disconnected from real-time server (lead channel)");
        setIsConnected(false);
      };

      socket.on("disconnect", handleDisconnect);

      const handleUpdate = (data, type, silent = false) => {
        console.log(`📡 Received ${type} update:`, data);

        setLeadData((prev) => {
          if (!prev) return prev;

          const merged = { ...prev };

          for (const key of Object.keys(data)) {
            if (key === "leadId" || key === "eventType") continue;

            if (
              data[key] &&
              typeof data[key] === "object" &&
              !Array.isArray(data[key]) &&
              prev[key] &&
              typeof prev[key] === "object"
            ) {
              merged[key] = { ...prev[key], ...data[key] };
            } else {
              merged[key] = data[key];
            }
          }

          return merged;
        });

        setLastUpdateType(type);

        setTimeout(() => {
          setLastUpdateType((prev) => (prev === type ? null : prev));
        }, 6000);

        if (silent) return;

        const notifTypeMap = {
          whatsapp: "WHATSAPP_REPLY",
          call: "CALL_COMPLETED",
          analytics: "LINK_OPENED",
        };

        const notifType = notifTypeMap[type] || "LINK_OPENED";

        const titleMap = {
          whatsapp: "WhatsApp Activity",
          call: "Voice Call Update",
          analytics: "Link Activity",
        };

        const title = titleMap[type] || "Live Update";

        let msg = `Real-time ${type} update`;

        if (type === "whatsapp") {
          if (data.whatsappResult === "NO")
            msg = "User rejected or opted out";
          else if (data.whatsappResult === "YES")
            msg = "User expressed interest!";
          else if (data.whatsappData?.status === "replied")
            msg = "New WhatsApp reply received";
        } else if (type === "analytics") {
          if (data.eventType === "form_submit")
            msg = "Lead submitted property form!";
          else if (data.eventType === "cta_click")
            msg = "Lead clicked a Call-to-Action";
          else if (data.eventType === "page_view")
            msg = "Lead is viewing the project";
        } else if (type === "call") {
          if (data.status === "completed") msg = "Voice call finished";
          else if (data.status === "started")
            msg = "Voice call initiated";
        }

        addToast(msg, notifType, title);
      };

      const handleWhatsapp = async (data) => {
        handleUpdate(data, "whatsapp");
        await fetchWhatsAppMessages();
      };
      const handleAnalytics = (data) => handleUpdate(data, "analytics");
      const handleCall = (data) => handleUpdate(data, "call");

      const handleLink = (data) => {
        if (data.automationId) {
          setLastUpdateType("analytics");

          setTimeout(() => {
            setLastUpdateType((prev) =>
              prev === "analytics" ? null : prev
            );
          }, 6000);

          return;
        }

        const isSilent = data.eventType === "time_update";
        handleUpdate(data, "analytics", isSilent);
      };

      socket.on("whatsapp_update", handleWhatsapp);
      socket.on("analytics_update", handleAnalytics);
      socket.on("call_update", handleCall);
      socket.on("link_update", handleLink);

      return () => {
        socket.emit("leave_lead", id);

        socket.off("connect", setupLiveConnection);
        socket.off("disconnect", handleDisconnect);
        socket.off("whatsapp_update", handleWhatsapp);
        socket.off("analytics_update", handleAnalytics);
        socket.off("call_update", handleCall);
        socket.off("link_update", handleLink);
      };
    }
  }, [id, refreshData, socket]);

  if (!leadData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Loading Lead Data...
          </p>
        </div>
      </div>
    );
  }

  const isAutomation =
    leadData.isAutomationOnly === true ||
    leadData.statusReason ===
      "Lead created from automation page (Initial outreach skipped)" ||
    leadData.whatsappData?.status === "skipped";

  return (
    <div className="animate-fade-in pb-24">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => navigate("/crm")}
          className="
            inline-flex
            items-center
            gap-2
            h-11
            px-4
            rounded-2xl
            border
            border-slate-200/80
            dark:border-white/10
            bg-white/70
            dark:bg-white/[0.03]
            backdrop-blur-xl
            text-slate-700
            dark:text-slate-200
            hover:border-primary/40
            hover:text-primary
            transition-all
            duration-300
            cursor-pointer
            shadow-sm
          "
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>

          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            CRM
          </span>
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {isConnected && (
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                h-10
                rounded-full
                border
                border-emerald-500/20
                bg-emerald-500/10
                text-emerald-500
              "
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>

              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                Live
              </span>
            </div>
          )}

          <div
            className="
              px-4
              h-10
              rounded-full
              border
              border-slate-200/80
              dark:border-white/10
              bg-white/70
              dark:bg-white/[0.03]
              backdrop-blur-xl
              flex
              items-center
              text-[10px]
              font-mono
              font-bold
              text-slate-600
              dark:text-slate-300
            "
          >
            {id}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-slate-200/70
          dark:border-white/10
          bg-white/75
          dark:bg-white/[0.03]
          backdrop-blur-2xl
          shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          dark:shadow-[0_10px_40px_rgba(0,0,0,0.25)]
          p-6
          sm:p-8
          mb-10
        "
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="px-3 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                  Lead Identity
                </span>
              </div>

              <div
                className={`
                  px-3
                  h-8
                  rounded-full
                  border
                  flex
                  items-center
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]

                  ${
                    leadData.status === "HOT"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : leadData.status === "WARM"
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      : leadData.status === "COLD"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }
                `}
              >
                {leadData.status || "NEW"}
              </div>
            </div>

            <h1
              className="
                text-3xl
                sm:text-5xl
                font-black
                tracking-tight
                text-slate-900
                dark:text-white
                leading-none
                mb-5
              "
            >
              {leadData.first_name} {leadData.last_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
              <div className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  call
                </span>

                <span className="font-semibold tracking-wide">
                  {leadData.phone_number}
                </span>
              </div>

              {user?.role === "admin" && leadData.createdBy?.name && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[16px]">
                    source
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {leadData.createdBy.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score Panel */}
          {!isAutomation && (
            <div
              className="
                w-full
                xl:w-[320px]
                rounded-[28px]
                border
                border-slate-200/70
                dark:border-white/10
                bg-slate-50/80
                dark:bg-white/[0.03]
                p-6
              "
            >
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-1">
                    AI Confidence
                  </p>

                  <h2 className="text-4xl font-black text-primary leading-none">
                    {leadData.score || 0}
                    <span className="text-lg text-slate-400">%</span>
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">
                    psychology
                  </span>
                </div>
              </div>

              <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{
                    width: `${leadData.score || 0}%`,
                  }}
                />
              </div>

              <div className="rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 p-4">
                <p className="text-[11px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                  “
                  {leadData.statusReason ||
                    "Processing interaction data..."}
                  ”
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Channel Section */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined">
            insights
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Communication Channels
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time engagement & activity tracking
          </p>
        </div>
      </div>

      {/* Main Grid */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  {/* WHATSAPP */}
{!isAutomation && (
  <div
    className={`
      rounded-[28px]
      border
      border-slate-200/70
      dark:border-white/10
      bg-white/75
      dark:bg-white/[0.03]
      backdrop-blur-2xl
      shadow-sm
      p-6
      transition-all
      duration-300
      hover:border-emerald-500/30
      hover:-translate-y-1

      ${
        lastUpdateType === "whatsapp"
          ? "ring-2 ring-emerald-500/30 border-emerald-500/30"
          : ""
      }
    `}
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">
            chat
          </span>
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            WhatsApp
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Messaging & reply tracking
          </p>
        </div>
      </div>

      <div className="px-3 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center">
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          Live
        </span>
      </div>
    </div>

    {/* <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6"> */}
      <WhatsAppSection
        leadData={leadData}
        chatMessages={chatMessages}
        isHighlighted={lastUpdateType === "whatsapp"}
      />
    {/* </div> */}
  </div>
)}

  {/* AI AGENT */}
{!isAutomation && (
  <div
    className={`
      rounded-[28px]
      border
      border-slate-200/70
      dark:border-white/10
      bg-white/75
      dark:bg-white/[0.03]
      backdrop-blur-2xl
      shadow-sm
      p-6
      transition-all
      duration-300
      hover:border-primary/30
      hover:-translate-y-1

      ${
        lastUpdateType === "call"
          ? "ring-2 ring-primary/30 border-primary/30"
          : ""
      }
    `}
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">
            support_agent
          </span>
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            AI Agent
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Voice calls & AI qualification
          </p>
        </div>
      </div>

      <div className="px-3 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center">
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          Active
        </span>
      </div>
    </div>

    {/* <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6"> */}
      <VoiceCallSection
        leadData={leadData}
        isHighlighted={lastUpdateType === "call"}
        onRefresh={refreshCallStatus}
        isRefreshing={isRefreshing}
      />
    {/* </div> */}
  </div>
)}

  {/* PORTFOLIO */}
<div
  className={`
    rounded-[28px]
    border
    border-slate-200/70
    dark:border-white/10
    bg-white/75
    dark:bg-white/[0.03]
    backdrop-blur-2xl
    shadow-sm
    p-6
    transition-all
    duration-300
    hover:border-blue-500/30
    hover:-translate-y-1

    ${
      lastUpdateType === "analytics"
        ? "ring-2 ring-blue-500/30 border-blue-500/30"
        : ""
    }
  `}
>
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px]">
          analytics
        </span>
      </div>

      <div>
        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Portfolio
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Link engagement & analytics
        </p>
      </div>
    </div>

    <div className="px-3 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center">
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">
        Tracking
      </span>
    </div>
  </div>

  {/* <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6"> */}
    <LinkActivitySection
      leadData={leadData}
      isHighlighted={lastUpdateType === "analytics"}
    />
  {/* </div> */}
</div>

        {/* EMAIL CARD */}
        <div
          className="
            rounded-[28px]
            border
            border-slate-200/70
            dark:border-white/10
            bg-white/75
            dark:bg-white/[0.03]
            backdrop-blur-2xl
            shadow-sm
            p-6
            transition-all
            duration-300
            hover:border-primary/30
            hover:-translate-y-1
          "
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">
                  mail
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Email
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Campaign & inbox activity
                </p>
              </div>
            </div>

            <div className="px-3 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                Coming Soon
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                alternate_email
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Email Integration
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Track opens, clicks, replies, and automated nurture campaigns
              directly from the dashboard.
            </p>
          </div>
        </div>

        {/* SMS CARD */}
        <div
          className="
            rounded-[28px]
            border
            border-slate-200/70
            dark:border-white/10
            bg-white/75
            dark:bg-white/[0.03]
            backdrop-blur-2xl
            shadow-sm
            p-6
            transition-all
            duration-300
            hover:border-primary/30
            hover:-translate-y-1
          "
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">
                  sms
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  SMS
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mobile engagement tracking
                </p>
              </div>
            </div>

            <div className="px-3 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                Beta
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                mark_chat_read
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              SMS Automation
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Send reminders, promotional campaigns, and follow-up sequences
              with delivery tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-slate-200 dark:border-white/10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Secure Lead Intelligence System • Real-Time Monitoring Enabled
        </p>
      </div>
    </div>
  );
};

export default LeadGenerationPage;