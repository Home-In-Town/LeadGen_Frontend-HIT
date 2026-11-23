// One line per ig_error code the backend callback can redirect with.
export const IG_ERROR_TEXT = {
  access_denied: 'You did not allow the permissions. Press Connect and tap Allow.',
  missing_scopes: 'Basic access was not granted, so the account was not connected.',
  code_missing: 'Instagram did not send a login code. Please try again.',
  state_invalid: 'The login session expired. Please try again.',
  state_expired: 'The login session expired. Please try again.',
  exchange_failed: 'Instagram did not accept the login. Please try again.',
  not_professional: 'This Instagram account must be a Business or Creator account.',
  ig_already_connected: 'This Instagram account is already connected to another OneEmployee account.',
  server_config_missing: 'Instagram Login is not configured on the server.',
  unknown: 'Instagram connection failed. Please try again.',
};
