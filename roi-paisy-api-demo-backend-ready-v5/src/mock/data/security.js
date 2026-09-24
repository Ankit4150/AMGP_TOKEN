export const securityState = {
  twoFactorEnabled: false,
  emailVerified: true,
  phoneVerified: true,
  loginAlerts: true,
  withdrawalConfirmation: true,
  sessionTimeout: '30 minutes',
  lastPasswordChange: '12 Sep 2026',
};

export const securitySessions = [
  { id: 'SES-001', device: 'Chrome on Windows', location: 'Gurugram, India', ip: '•••.•••.24', lastActive: 'Active now', current: true },
  { id: 'SES-002', device: 'Chrome on Android', location: 'Gurugram, India', ip: '•••.•••.81', lastActive: '2 hours ago', current: false },
  { id: 'SES-003', device: 'Edge on Windows', location: 'Delhi, India', ip: '•••.•••.43', lastActive: '18 Sep 2026, 8:42 PM', current: false },
];

export const securityActivity = [
  { id: 'SEC-ACT-001', action: 'Successful login', device: 'Chrome on Windows', location: 'Gurugram, India', date: '19 Sep 2026, 12:01 PM', status: 'Success' },
  { id: 'SEC-ACT-002', action: 'Password changed', device: 'Chrome on Windows', location: 'Gurugram, India', date: '12 Sep 2026, 6:20 PM', status: 'Success' },
  { id: 'SEC-ACT-003', action: '2FA preference viewed', device: 'Chrome on Android', location: 'Gurugram, India', date: '10 Sep 2026, 9:15 AM', status: 'Success' },
  { id: 'SEC-ACT-004', action: 'Login attempt blocked', device: 'Unknown browser', location: 'Unknown location', date: '07 Sep 2026, 11:42 PM', status: 'Blocked' },
];
