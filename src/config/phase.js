/**
 * phase.js
 *
 * Central phase configuration.
 * VITE_PHASE=1 → Phase 1 (webmagnetmedia.com) — no HIT/Projects
 * VITE_PHASE=2 → Phase 2 (oneemployee.in) — full features with HIT integration
 *
 * Default: Phase 2 (backward compatible)
 */

const PHASE = Number(import.meta.env.VITE_PHASE) || 2;

export const IS_PHASE_1 = PHASE === 1;
export const IS_PHASE_2 = PHASE === 2;

// App branding
export const APP_NAME   = IS_PHASE_1 ? 'Web Magnet Media' : 'OneEmployee';
export const APP_DOMAIN = IS_PHASE_1 ? 'webmagnetmedia.com' : 'oneemployee.in';
export const APP_TAGLINE = IS_PHASE_1
    ? 'AI-Powered Lead Automation'
    : 'CRM Workspace';

// Sub-branding for Phase 1 (shows "Powered by OneEmployee")
export const SHOW_POWERED_BY = IS_PHASE_1;
export const POWERED_BY_TEXT = 'Powered by OneEmployee';

// Logo paths
export const LOGO_PATH = IS_PHASE_1 ? '/webmagnetmedia-logo.png' : '/One Employee.svg';

// Brand colors
export const BRAND_COLOR = IS_PHASE_1 ? '#F47B20' : '#1877F2'; // Orange for WMM, Facebook Blue for OE
export const BRAND_GRADIENT = IS_PHASE_1
    ? 'linear-gradient(135deg, #F47B20, #FF9A44)'
    : 'linear-gradient(135deg, #1877F2, #42A5F5)';

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
