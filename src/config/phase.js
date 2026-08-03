/**
 * phase.js
 *
 * Central phase configuration.
 * VITE_PHASE=1 → Phase 1 (metamagnet.com) — no HIT/Projects
 * VITE_PHASE=2 → Phase 2 (oneemployee.in) — full features with HIT integration
 *
 * Default: Phase 2 (backward compatible)
 */

const PHASE = Number(import.meta.env.VITE_PHASE) || 2;

export const IS_PHASE_1 = PHASE === 1;
export const IS_PHASE_2 = PHASE === 2;

// App branding
export const APP_NAME   = IS_PHASE_1 ? 'MetaMagnet' : 'One Employee';
export const APP_DOMAIN = IS_PHASE_1 ? 'metamagnet.com' : 'oneemployee.in';
export const APP_TAGLINE = IS_PHASE_1
    ? 'AI-Powered Lead Automation'
    : 'CRM Workspace';

// Feature flags
export const FEATURES = {
    // Available in both phases
    crm:           true,
    leads:         true,
    campaigns:     true,
    whatsapp:      true,
    email:         true,
    voiceCalls:    true,
    fbLeadAds:     true,
    googleAds:     true,
    metaSocial:    true,
    leadAutomation: true,

    // Phase 2 only (HIT-connected features)
    projects:      IS_PHASE_2,
    hitIntegration: IS_PHASE_2,
    hitLinking:    IS_PHASE_2,
    addProject:    IS_PHASE_2,
};
