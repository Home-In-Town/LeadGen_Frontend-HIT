/**
 * WhatsApp channel card for the lead detail view.
 */
const WhatsAppSection = ({
  leadData,
  isHighlighted,
  chatMessages = [],
}) => {

  const hasReply = !!leadData.whatsappResult;

  const statusConfig = {
    YES: {
      label: "Interested",
      classes:
        "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500",
      icon: "thumb_up",
    },
    NO: {
      label: "Rejected",
      classes: "bg-red-500/10 border border-red-500/20 text-red-500",
      icon: "thumb_down",
    },
    sent: {
      label: "Sent",
      classes:
        "bg-primary/10 border border-primary/20 text-primary",
      icon: "schedule",
    },
    pending: {
      label: "Pending",
      classes:
        "bg-slate-500/10 border border-slate-500/20 text-slate-500",
      icon: "hourglass_empty",
    },
  };

  const currentStatus = hasReply
    ? statusConfig[leadData.whatsappResult]
    : leadData.whatsappData?.status === "sent"
    ? statusConfig.sent
    : statusConfig.pending;

  return (
    <div
      className={`
        relative
        rounded-[24px]
        border
        border-slate-200/70
        dark:border-white/10
        bg-slate-50/80
        dark:bg-white/[0.02]
        p-5
        transition-all
        duration-300

        ${
          isHighlighted
            ? "ring-2 ring-emerald-500/20 border-emerald-500/30"
            : ""
        }
      `}
    >
      {/* LIVE UPDATE BADGE */}
      {isHighlighted && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>

          <span className="text-[8px] font-black uppercase tracking-[0.2em]">
            Updated
          </span>
        </div>
      )}

      {/* TOP */}
      {/* <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">
              chat
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              WhatsApp Activity
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Message delivery & customer responses
            </p>
          </div>
        </div>
      </div> */}

      {/* STATUS */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div
          className={`
            h-9
            px-3
            rounded-full
            flex
            items-center
            gap-2
            ${currentStatus.classes}
          `}
        >
          <span className="material-symbols-outlined text-[16px]">
            {currentStatus.icon}
          </span>

          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
            {currentStatus.label}
          </span>
        </div>

        {leadData.whatsappData?.sentAt && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Last Activity
            </p>

            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {new Date(
                leadData.whatsappData.sentAt
              ).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="space-y-4">
        {/* RESPONSE MESSAGE */}
        {leadData.whatsappResult === "YES" && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  sentiment_satisfied
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-emerald-600 mb-1">
                  Positive Response
                </h4>

                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Lead expressed interest in the project and engaged with the
                  campaign.
                </p>
              </div>
            </div>
          </div>
        )}

        {leadData.whatsappResult === "NO" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  sentiment_dissatisfied
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-red-600 mb-1">
                  Negative Response
                </h4>

                <p className="text-sm text-red-700 dark:text-red-400">
                  Lead rejected the offer or opted out from future engagement.
                </p>
              </div>
            </div>
          </div>
        )}

        {leadData.whatsappData?.status === "sent" &&
          !leadData.whatsappResult && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">
                    schedule_send
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    Awaiting Reply
                  </h4>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    WhatsApp template delivered successfully. Waiting for lead
                    interaction.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ERROR */}
        {leadData.whatsappData?.error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-500">
              {leadData.whatsappData.error}
            </p>
          </div>
        )}
      </div>
      {/* CHAT CONVERSATION */}
      {chatMessages.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Conversation
            </h4>

            <span className="text-[10px] text-slate-400 font-semibold">
              {chatMessages.length} messages
            </span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {chatMessages.map((msg, index) => {
              const isSystem =
                msg.sender === "system" ||
                msg.sender === "agent" ||
                msg.sender === "builder" ||
                msg.sender === "service_user";

              return (
                <div
                  key={msg._id || index}
                  className={`flex ${
                    isSystem ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[85%]
                      rounded-2xl
                      px-4
                      py-3
                      text-sm
                      shadow-sm
                      border

                      ${
                        isSystem
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
                      }
                    `}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    <div
                      className={`
                        mt-2
                        text-[10px]
                        font-semibold

                        ${
                          isSystem
                            ? "text-white/70"
                            : "text-slate-400"
                        }
                      `}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* FOOTER */}
      {(leadData.whatsappData?.messageSid ||
        leadData.whatsappData?.sentAt) && (
        <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-white/10 flex flex-col gap-3">
          {leadData.whatsappData?.messageSid && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Message ID
              </span>

              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {leadData.whatsappData.messageSid.slice(0, 18)}...
              </span>
            </div>
          )}

          {chatMessages.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        Latest Conversation
      </span>

      <span className="text-[10px] font-semibold text-emerald-500">
        {chatMessages.length} messages
      </span>
    </div>

    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
      {chatMessages.slice(-3).map((msg, idx) => {
        const isSystem =
          msg.sender === "system" ||
          msg.sender === "agent" ||
          msg.sender === "builder" ||
          msg.sender === "service_user";

        return (
          <div
            key={msg._id || idx}
            className={`flex ${
              isSystem ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                isSystem
                  ? "bg-emerald-500 text-white rounded-br-md"
                  : "bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-bl-md"
              }`}
            >
              <p className="leading-relaxed break-words">
                {msg.content}
              </p>

              <div
                className={`mt-1 text-[9px] ${
                  isSystem
                    ? "text-white/70"
                    : "text-slate-400"
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
        </div>
      )}
    </div>
  );
};

export default WhatsAppSection;