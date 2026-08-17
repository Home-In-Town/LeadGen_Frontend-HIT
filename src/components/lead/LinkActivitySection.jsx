import { formatTime } from '../../utils/leadUtils';

/**
 * Link Activity / Portfolio channel card for the lead detail view.
 * Refactored UI only — backend untouched.
 */
const LinkActivitySection = ({ leadData, isHighlighted }) => {
  const opened = leadData.linkActivity?.opened;
  const submitted = leadData.linkActivity?.submittedForm;
  const duration = leadData.linkActivity?.timeSpentSeconds || 0;

  return (
    <div className="space-y-5">
      {/* STATUS ROW */}
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

            ${
              opened
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
            }
          `}
        >
          <span
            className={`
              w-2
              h-2
              rounded-full

              ${
                opened
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-slate-400'
              }
            `}
          />

          {opened ? 'Tracking Active' : 'Idle'}
        </div>

        <div
          className="
            h-10
            px-4
            rounded-2xl
            border
            border-blue-500/15
            bg-blue-500/[0.04]
            text-blue-500
            flex
            items-center
            justify-center
            text-[11px]
            font-black
            uppercase
            tracking-[0.18em]
          "
        >
          Analytics
        </div>
      </div>

      {/* MAIN ANALYTICS PANEL */}
      <div
        className={`
          rounded-2xl
          border
          p-5
          transition-all
          duration-300
          border-blue-500/15
          bg-blue-500/[0.03]

          ${
            isHighlighted
              ? 'ring-2 ring-blue-500/20 border-blue-500/30'
              : ''
          }
        `}
      >
        <div className="space-y-5">
          {/* METRICS GRID */}
          <div className="grid grid-cols-2 gap-4">
            {/* LINK OPENED */}
            <div
              className="
                rounded-2xl
                border
                border-slate-200/70
                dark:border-white/10
                bg-white/70
                dark:bg-white/[0.03]
                p-4
              "
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Link Opened
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-[18px]

                    ${
                      opened
                        ? 'text-emerald-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }
                  `}
                >
                  language
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-2.5
                    h-2.5
                    rounded-full

                    ${
                      opened
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }
                  `}
                />

                <p
                  className={`
                    text-sm
                    font-black
                    uppercase

                    ${
                      opened
                        ? 'text-emerald-500'
                        : 'text-slate-400'
                    }
                  `}
                >
                  {opened ? 'YES' : 'NO'}
                </p>
              </div>
            </div>

            {/* FORM SUBMITTED */}
            <div
              className="
                rounded-2xl
                border
                border-slate-200/70
                dark:border-white/10
                bg-white/70
                dark:bg-white/[0.03]
                p-4
              "
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Form Submit
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-[18px]

                    ${
                      submitted
                        ? 'text-emerald-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }
                  `}
                >
                  assignment_turned_in
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-2.5
                    h-2.5
                    rounded-full

                    ${
                      submitted
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }
                  `}
                />

                <p
                  className={`
                    text-sm
                    font-black
                    uppercase

                    ${
                      submitted
                        ? 'text-emerald-500'
                        : 'text-slate-400'
                    }
                  `}
                >
                  {submitted ? 'YES' : 'NO'}
                </p>
              </div>
            </div>
          </div>

          {/* DURATION CARD */}
          <div
            className="
              rounded-2xl
              border
              border-blue-500/15
              bg-blue-500/[0.04]
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Engagement Duration
                </p>

                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {formatTime(duration)}
                </h3>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px]">
                  timer
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVITY STATE */}
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-300
              dark:border-white/10
              bg-slate-50/70
              dark:bg-white/[0.02]
              p-5
            "
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  monitoring
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Portfolio Analytics
                </h4>

                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Real-time engagement tracking for property portfolio
                  visits, interaction behaviour, and lead conversion
                  signals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-[16px]">
            insights
          </span>

          Portfolio Engagement Engine
        </div>

        {leadData.linkActivity?.lastOpenedAt && (
          <span className="font-mono text-slate-400">
            {new Date(
              leadData.linkActivity.lastOpenedAt
            ).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default LinkActivitySection;