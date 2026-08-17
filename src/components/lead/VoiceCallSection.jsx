/**
 * AI Voice Call channel card for the lead detail view.
 * Refactored UI only — backend untouched.
 */
const VoiceCallSection = ({
  leadData,
  isHighlighted,
  onRefresh,
  isRefreshing,
}) => {
  const callStatus = leadData.voiceCallData?.status?.toLowerCase();

  const statusStyles =
    callStatus === "failed"
      ? "bg-red-500/10 border-red-500/20 text-red-500"
      : callStatus === "completed" || callStatus === "analytics"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
      : "bg-primary/10 border-primary/20 text-primary";

  return (
    <div className="space-y-5">
      {/* TOP STATUS ROW */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={`
            inline-flex
            items-center
            gap-2
            px-3
            py-1.5
            rounded-full
            border
            text-[10px]
            font-black
            uppercase
            tracking-[0.2em]
            ${statusStyles}
          `}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              callStatus === "failed"
                ? "bg-red-500"
                : callStatus === "completed" || callStatus === "analytics"
                ? "bg-emerald-500 animate-pulse"
                : "bg-primary animate-pulse"
            }`}
          />

          {callStatus === "failed"
            ? leadData.voiceCallData?.failReason ===
              "unanswered_or_declined"
              ? "No Answer"
              : "Failed"
            : leadData.voiceCallData?.status || "Initializing"}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="
            h-10
            w-10
            rounded-2xl
            border
            border-slate-200/70
            dark:border-white/10
            bg-slate-100/70
            dark:bg-white/[0.03]
            flex
            items-center
            justify-center
            text-slate-600
            dark:text-slate-300
            hover:border-primary/30
            hover:text-primary
            transition-all
            duration-300
            disabled:opacity-50
            cursor-pointer
          "
          title="Refresh Call Status"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            sync
          </span>
        </button>
      </div>

      {/* CALL STATE */}
      <div
        className={`
          rounded-2xl
          border
          p-5
          transition-all
          duration-300

          ${
            callStatus === "failed"
              ? "border-red-500/15 bg-red-500/[0.03]"
              : callStatus === "completed" ||
                callStatus === "analytics"
              ? "border-emerald-500/15 bg-emerald-500/[0.03]"
              : "border-primary/15 bg-primary/[0.03]"
          }

          ${
            isHighlighted
              ? "ring-2 ring-primary/20 border-primary/30"
              : ""
          }
        `}
      >
        {callStatus === "failed" ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                call_end
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                Call Failed
              </h4>

              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {leadData.voiceCallData?.failReason ===
                "unanswered_or_declined"
                  ? "Lead did not answer or declined the AI voice call."
                  : "The AI agent could not establish a successful call session."}
              </p>
            </div>
          </div>
        ) : leadData.aiCallResult ? (
          <div className="space-y-5">
            {/* INSIGHTS GRID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Interest
                </p>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    trending_up
                  </span>

                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                    {leadData.aiCallResult.interest || "N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Budget
                </p>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">
                    payments
                  </span>

                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                    {leadData.aiCallResult.budget || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* RECORDING */}
            {leadData.voiceCallData?.recordingLink && (
              <a
                href={leadData.voiceCallData.recordingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  border-primary/15
                  bg-primary/[0.04]
                  px-4
                  py-3
                  hover:border-primary/30
                  hover:bg-primary/[0.07]
                  transition-all
                  duration-300
                  group
                "
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      play_circle
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Call Recording
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Listen to AI conversation
                    </p>
                  </div>
                </div>

                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  open_in_new
                </span>
              </a>
            )}

            {/* TRANSCRIPT */}
            {leadData.voiceCallData?.transcript && (
              <details className="group rounded-2xl border border-slate-200/70 dark:border-white/10 overflow-hidden">
                <summary
                  className="
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3
                    cursor-pointer
                    bg-slate-50/70
                    dark:bg-white/[0.02]
                    hover:bg-slate-100/70
                    dark:hover:bg-white/[0.04]
                    transition-colors
                    list-none
                  "
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">
                      article
                    </span>

                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Transcript
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Expand to read full conversation
                      </p>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>

                <div className="p-4">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {leadData.voiceCallData.transcript}
                  </p>
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[30px]">
                support_agent
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              AI Agent Processing
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              The AI voice agent is currently gathering qualification data
              and conversation insights.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER META */}
      <div className="flex items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-[16px]">
            psychology
          </span>

          AI Qualification Engine
        </div>

        {leadData.voiceCallData?.updatedAt && (
          <span className="font-mono text-slate-400">
            {new Date(
              leadData.voiceCallData.updatedAt
            ).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default VoiceCallSection;