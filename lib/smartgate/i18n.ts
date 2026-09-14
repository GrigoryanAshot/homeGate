import type { GateState, GuestPassDuration } from "./types";

export type Locale = "en" | "hy" | "ru";

export const LOCALE_STORAGE_KEY = "smartgate-locale";

export type SmartGateMessages = {
  appTitle: string;
  presentationBadge: string;
  selectGate: string;
  myGates: string;
  addGate: string;
  scanGateTitle: string;
  scanGateHint: string;
  scanGateHintDb: string;
  scanGateHintCamera: string;
  scanGateAction: string;
  scanGateActionDemo: string;
  scanGateScanning: string;
  scanCameraStarting: string;
  scanCameraStop: string;
  scanCameraStopped: string;
  scanCameraPermissionDenied: string;
  scanCameraUnavailable: string;
  scanGateSuccess: string;
  scanGateNameLabel: string;
  scanGateSave: string;
  scanGatePasteLabel: string;
  scanGatePasteAction: string;
  deviceAlreadyInUse: string;
  deviceNotFound: string;
  deviceQrInvalid: string;
  deviceClaimFailed: string;
  toastGateAdded: (name: string) => string;
  gateMenuHint: string;
  gateRenameAction: string;
  gateRenameLabel: string;
  gateResetAction: string;
  gateResetConfirm: (name: string) => string;
  gateRemoveAction: string;
  gateRemoveConfirm: (name: string) => string;
  toastGateRenamed: string;
  toastGateRemoved: string;
  guestViewSubtitle: string;
  previewGuestView: string;
  changeAccess: string;
  editAccessTitle: string;
  saveAccessChanges: string;
  toastAccessUpdated: string;
  shareAgain: string;
  practiceMode: string;
  connected: string;
  connecting: string;
  offline: string;
  tabControl: string;
  tabControlHint: string;
  tabShare: string;
  tabShareHint: string;
  controllersTitle: string;
  controllersIntro: string;
  addController: string;
  removeController: string;
  viewHistory: string;
  historyTitle: string;
  historyEmpty: string;
  historyOpen: string;
  historyClose: string;
  controllerName: string;
  controllerNamePlaceholder: string;
  saveController: string;
  accessDurationLabel: string;
  ruleUnlimited: string;
  ruleUnlimitedHint: string;
  ruleOnce: string;
  ruleOnceHint: string;
  rule1h: string;
  rule24h: string;
  rule7d: string;
  ruleFromTo: string;
  ruleFromToHint: string;
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
  timeNow: string;
  hourColumn: string;
  minuteColumn: string;
  noControllers: string;
  toastControllerAdded: string;
  toastControllerRemoved: string;
  shareInviteTitle: string;
  shareInviteIntro: string;
  shareInviteIntroDemo: string;
  shareViaWhatsApp: string;
  copyInviteLink: string;
  copiedInviteLink: string;
  inviteQrHint: string;
  shareQrImage: string;
  shareQrSaved: string;
  shareDone: string;
  inviteLoading: string;
  inviteInvalid: string;
  inviteExpired: string;
  inviteRevoked: string;
  inviteNotStarted: string;
  inviteUsed: string;
  inviteOtherDevice: string;
  inviteWelcome: (name: string) => string;
  gateStatusNow: string;
  pleaseWait: string;
  tapButton: string;
  open: string;
  openHint: string;
  close: string;
  closeHint: string;
  stop: string;
  stopHint: string;
  shareTitle: string;
  shareIntro: string;
  step1: string;
  step2: string;
  qrHint: string;
  copyLink: string;
  copiedLink: string;
  whatsappTip: string;
  duration1h: string;
  duration24h: string;
  durationOnce: string;
  durationHint1h: string;
  durationHint24h: string;
  durationHintOnce: string;
  gateNotConnected: string;
  mockModeHint: string;
  toastOpening: string;
  toastClosing: string;
  toastStopped: string;
  toastCommandFailed: string;
  toastRevoked: string;
  moreOptions: string;
  settings: string;
  settingsClose: string;
  back: string;
  language: string;
  mockMode: string;
  mockModeDescription: string;
  /** Leave sticky demo / presentation mode and use real MQTT */
  exitDemoMode: string;
  exitDemoModeDescription: string;
  resetDevice: string;
  darkMode: string;
  biometricLock: string;
  biometricLockHint: string;
  biometricUnlock: string;
  biometricChecking: string;
  biometricDescription: string;
  biometricNotSupported: string;
  biometricEnabledToast: string;
  biometricDisabledToast: string;
  biometricCancelled: string;
  biometricFailed: string;
  wifiSetupTitle: string;
  wifiSetupMenuHint: string;
  wifiSetupIntro: string;
  wifiSetupStep1: string;
  wifiSetupStep2: string;
  wifiSetupStep3: string;
  wifiSetupStep4: string;
  wifiSetupStep5: string;
  wifiSetupReset: string;
  wifiResetAction: string;
  wifiResetConfirm: string;
  wifiResetSentToast: string;
  wifiResetNeedMqtt: string;
  mqttSettingsTitle: string;
  mqttSettingsHint: string;
  mqttHost: string;
  mqttUser: string;
  mqttPass: string;
  mqttSave: string;
  mqttSavedToast: string;
  forDevelopers: string;
  connectSpecialist: string;
  toastSpecialistRequested: string;
  creditBefore: string;
  creditAfter: string;
  authLoading: string;
  authProfileTitle: string;
  authProfileHint: string;
  authNameLabel: string;
  authNamePlaceholder: string;
  authNameSave: string;
  authNameSaving: string;
  authNameNeededHint: string;
  authNameRequired: string;
  authNameSaveFailed: string;
  authNameSavedToast: string;
  authNameSavedHint: string;
  authSignOut: string;
  authSignInTitle: string;
  authSignInHint: string;
  authEmailPlaceholder: string;
  authSendCode: string;
  authSending: string;
  authCodeSentTo: (email: string) => string;
  authCodePlaceholder: string;
  authVerifyCode: string;
  authVerifying: string;
  authChangeEmail: string;
  authDevCodeHint: (code: string) => string;
  authInvalidEmail: string;
  authRateLimited: string;
  authRateLimitedWait: (sec: number) => string;
  authSendFailed: string;
  authCheckSpamHint: string;
  authInvalidCode: string;
  authCodeSentToast: string;
  authSignedInToast: string;
  authSignedOutToast: string;
  authRequiredToClaim: string;
  gateStates: Record<GateState, string>;
};

const en: SmartGateMessages = {
  appTitle: "Touch SmartGate",
  presentationBadge: "Live demo — simulated gate",
  selectGate: "Gate",
  myGates: "My gates",
  addGate: "Add gate",
  scanGateTitle: "Scan device QR",
  scanGateHint:
    "Point your phone at the QR code on the gate remote or control box to add it.",
  scanGateHintDb:
    "Scan or paste the factory QR. Free devices can be claimed once — busy devices are rejected.",
  scanGateHintCamera:
    "Point the camera at the QR on the gate box. Camera needs HTTPS (or localhost).",
  scanGateAction: "Scan QR code",
  scanGateActionDemo: "Use demo FREE device (no camera)",
  scanGateScanning: "Scanning…",
  scanCameraStarting: "Starting camera…",
  scanCameraStop: "Stop camera",
  scanCameraStopped: "Camera off",
  scanCameraPermissionDenied:
    "Camera permission denied. Allow camera for this site, or paste the QR link below.",
  scanCameraUnavailable:
    "Camera not available on this device. Paste the QR link or use the demo button.",
  scanGateSuccess: "Device found — name your gate",
  scanGateNameLabel: "Gate name",
  scanGateSave: "Add gate",
  scanGatePasteLabel: "Or paste QR / pair link",
  scanGatePasteAction: "Use this code",
  deviceAlreadyInUse: "This device is already in use on another account.",
  deviceNotFound: "Device not found in database.",
  deviceQrInvalid: "Invalid QR / pair code.",
  deviceClaimFailed: "Could not claim device. Try again.",
  toastGateAdded: (name) => `${name} added`,
  gateMenuHint: "This gate only",
  gateRenameAction: "Rename gate",
  gateRenameLabel: "Gate name",
  gateResetAction: "Reset Wi‑Fi & clear shares",
  gateResetConfirm: (name) =>
    `Reset “${name}” only? Clears this gate’s Wi‑Fi and its shared users. Other gates are not touched.`,
  gateRemoveAction: "Remove gate from my account",
  gateRemoveConfirm: (name) =>
    `Remove “${name}” from your account? Its shared users are cleared. Other gates stay.`,
  toastGateRenamed: "Gate renamed",
  toastGateRemoved: "Gate removed",
  guestViewSubtitle: "Shared access — open & close only",
  previewGuestView: "Preview guest screen",
  changeAccess: "Change",
  editAccessTitle: "Change access",
  saveAccessChanges: "Save changes",
  toastAccessUpdated: "Access updated",
  shareAgain: "Share",
  practiceMode: "Demo mode",
  connected: "Connected",
  connecting: "Connecting…",
  offline: "Offline",
  tabControl: "My gate",
  tabControlHint: "Open, close, stop",
  tabShare: "Other controllers",
  tabShareHint: "Who can control the gate",
  controllersTitle: "Other controllers",
  controllersIntro:
    "People who can open this gate. Each gate has its own member list — they never mix.",
  addController: "Add person",
  removeController: "Remove",
  viewHistory: "Open / close history",
  historyTitle: "Who opened or closed",
  historyEmpty: "No history yet",
  historyOpen: "Opened",
  historyClose: "Closed",
  controllerName: "Name",
  controllerNamePlaceholder: "e.g. Ani, courier, guest",
  saveController: "Save access",
  accessDurationLabel: "How long?",
  ruleUnlimited: "Unlimited",
  ruleUnlimitedHint: "Spouse, family — always",
  ruleOnce: "One-time",
  ruleOnceHint: "Works once, then expires",
  rule1h: "1 hour",
  rule24h: "24 hours",
  rule7d: "7 days",
  ruleFromTo: "From – to",
  ruleFromToHint: "Pick start and end dates",
  fromDate: "From",
  toDate: "To",
  fromTime: "Start time",
  toTime: "End time",
  timeNow: "Now",
  hourColumn: "Hour",
  minuteColumn: "Min",
  noControllers: "No one else has access yet",
  toastControllerAdded: "Access added",
  toastControllerRemoved: "Access removed",
  shareInviteTitle: "Send invite",
  shareInviteIntro:
    "QR is below (same link). WhatsApp sends the text link — use “Send QR image” to attach the code.",
  shareInviteIntroDemo:
    "Show the partner how sharing works — QR, WhatsApp, or preview the guest screen.",
  shareViaWhatsApp: "Share link on WhatsApp",
  copyInviteLink: "Copy link",
  copiedInviteLink: "Link copied",
  inviteQrHint: "Scan with phone camera — opens the same invite link",
  shareQrImage: "Send QR image",
  shareQrSaved: "QR saved — attach it in WhatsApp chat",
  shareDone: "Done",
  inviteLoading: "Checking access…",
  inviteInvalid: "This link is not valid.",
  inviteExpired: "This access has expired.",
  inviteRevoked: "This access was removed by the owner.",
  inviteNotStarted: "Access has not started yet.",
  inviteUsed: "This one-time link was already used.",
  inviteOtherDevice:
    "This link is already active on another phone. Ask the admin for a new invite.",
  inviteWelcome: (name) => `Hello, ${name}`,
  gateStatusNow: "Right now the gate is",
  pleaseWait: "Please wait…",
  tapButton: "Tap a button",
  open: "Open",
  openHint: "Raise the gate up",
  close: "Close",
  closeHint: "Lower the gate down",
  stop: "Stop",
  stopHint: "Gate stuck? Tap here",
  shareTitle: "Share with a guest",
  shareIntro:
    "Create a link and send it by WhatsApp, SMS, or any chat. Your guest opens the link — they do not need this app.",
  step1: "Step 1 — How long?",
  step2: "Step 2 — Send this",
  qrHint: "Guest can scan this QR code with their phone camera",
  copyLink: "Copy link to send",
  copiedLink: "Copied! Now paste in chat",
  whatsappTip:
    "Tip: After you copy, open WhatsApp → pick the person → long press → Paste → Send.",
  duration1h: "1 hour",
  duration24h: "24 hours",
  durationOnce: "One-time use",
  durationHint1h: "Good for a quick visit",
  durationHint24h: "Good for delivery or guest today",
  durationHintOnce: "Link works only one time",
  gateNotConnected:
    "Gate not connected. Check Wi‑Fi and MQTT (same broker as your ESP).",
  mockModeHint:
    "Mock mode is on — buttons only change the picture on screen, not your real gate.",
  toastOpening: "Opening gate…",
  toastClosing: "Closing gate…",
  toastStopped: "Gate stopped",
  toastCommandFailed: "Cannot reach gate — check MQTT connection",
  toastRevoked: "Access revoked",
  moreOptions: "More options (for property managers)",
  settings: "Settings",
  settingsClose: "Done",
  back: "Back",
  language: "Language",
  mockMode: "Try without real gate (mock mode)",
  mockModeDescription:
    "Use this to practice. Buttons will not control your real gate.",
  exitDemoMode: "Demo mode (simulated gate)",
  exitDemoModeDescription:
    "Turn this off to control your real gate over MQTT.",
  resetDevice: "Reset gate Wi‑Fi",
  darkMode: "Dark mode",
  biometricLock: "Face ID / Fingerprint",
  biometricLockHint:
    "Confirm with Face ID or fingerprint to open Touch SmartGate.",
  biometricUnlock: "Unlock with Face ID / Fingerprint",
  biometricChecking: "Checking…",
  biometricDescription:
    "Require Face ID or fingerprint when opening the app and before sharing access.",
  biometricNotSupported:
    "Face ID / fingerprint is not available on this device or browser.",
  biometricEnabledToast: "Face ID / fingerprint enabled",
  biometricDisabledToast: "Face ID / fingerprint turned off",
  biometricCancelled: "Cancelled — action not allowed",
  biometricFailed: "Could not verify Face ID / fingerprint",
  wifiSetupTitle: "Set up gate Wi‑Fi",
  wifiSetupMenuHint: "New box · SoftAP from phone",
  wifiSetupIntro:
    "The controller creates a temporary Wi‑Fi so you can give it your home network — no cable needed.",
  wifiSetupStep1: "Power the gate box. Fast blinking LED = waiting for setup.",
  wifiSetupStep2: "On your phone, join Wi‑Fi named TouchGate-XXXX (open network).",
  wifiSetupStep3: "Open http://192.168.4.1 in the browser (or wait for the setup page).",
  wifiSetupStep4: "Choose your home Wi‑Fi from the list, type the password → Save & Connect.",
  wifiSetupStep5: "Phone rejoins home Wi‑Fi. LED steady, then scan the device QR in the app.",
  wifiSetupReset:
    "Wrong Wi‑Fi? Use the gear on that gate card (or Settings → Reset). Clears only that gate’s shares and brings SoftAP back. Other gates stay.",
  wifiResetAction: "Reset selected gate setup",
  wifiResetConfirm:
    "Reset the selected gate only? Clears its Wi‑Fi and its shared members. Other gates are not touched.",
  wifiResetSentToast:
    "Reset sent for this gate — join TouchGate-XXXX, open 192.168.4.1",
  wifiResetNeedMqtt: "Connect to the gate (MQTT) first, then reset.",
  mqttSettingsTitle: "MQTT (gate connection)",
  mqttSettingsHint:
    "Same HiveMQ host, username, and password as in the ESP config.h / old app gear menu.",
  mqttHost: "Broker host",
  mqttUser: "Username",
  mqttPass: "Password",
  mqttSave: "Save & reconnect",
  mqttSavedToast: "MQTT saved — reconnecting…",
  forDevelopers: "For developers",
  connectSpecialist: "Contact a service specialist",
  toastSpecialistRequested: "A specialist will contact you shortly",
  creditBefore: "System developed and maintained by ",
  creditAfter: "",
  authLoading: "Loading profile…",
  authProfileTitle: "Your profile",
  authProfileHint:
    "Gates you claim are saved to this email. Use Gmail, iCloud Mail, Outlook, or any other email.",
  authNameLabel: "Your name",
  authNamePlaceholder: "e.g. Ashot",
  authNameSave: "Save name",
  authNameSaving: "Saving…",
  authNameNeededHint: "Add your name so family invites show who shared access.",
  authNameRequired: "Enter your name.",
  authNameSaveFailed: "Could not save name. Try again.",
  authNameSavedToast: "Name saved",
  authNameSavedHint: "Done. Close Settings, then add your gate with the sticker QR.",
  authSignOut: "Sign out",
  authSignInTitle: "Sign in",
  authSignInHint:
    "Enter your email (Gmail, iCloud, Outlook, …). We’ll send a 6‑digit code — no password.",
  authEmailPlaceholder: "you@gmail.com",
  authSendCode: "Send login code",
  authSending: "Sending…",
  authCodeSentTo: (email) => `Code sent to ${email}`,
  authCodePlaceholder: "000000",
  authVerifyCode: "Verify & sign in",
  authVerifying: "Checking…",
  authChangeEmail: "Use a different email",
  authDevCodeHint: (code) => `Dev mode — your code is ${code}`,
  authInvalidEmail: "Enter a valid email address.",
  authRateLimited: "Wait a moment, then request a new code.",
  authRateLimitedWait: (sec) => `Wait ${sec}s, then request a new code.`,
  authSendFailed: "Could not send email. Try again.",
  authCheckSpamHint: "No email? Check Spam / Promotions. Subject starts with “SmartGate login code”.",
  authInvalidCode: "Wrong or expired code.",
  authCodeSentToast: "Check your email for the code",
  authSignedInToast: "Signed in",
  authSignedOutToast: "Signed out",
  authRequiredToClaim: "Sign in from Settings first, then claim this gate.",
  gateStates: {
    closed: "Gate is closed",
    open: "Gate is open",
    opening: "Gate is opening…",
    closing: "Gate is closing…",
    stopped: "Gate is stopped",
    unknown: "Status unknown",
  },
};

const hy: SmartGateMessages = {
  appTitle: "Touch SmartGate",
  presentationBadge: "Ցուցադրական ռեժիմ",
  selectGate: "Դարպաս",
  myGates: "Իմ դարպասները",
  addGate: "Ավելացնել",
  scanGateTitle: "Սկանավորել QR կոդը",
  scanGateHint:
    "Ուղղեք հեռախոսը դարպասի հեռակառավարման կամ վահանակի QR կոդին՝ ավելացնելու համար։",
  scanGateHintDb:
    "Սկանավորեք կամ տեղադրեք գործարանային QR-ը։ Ազատ սարքը կարելի է վերցնել մեկ անգամ — զբաղվածը մերժվում է։",
  scanGateHintCamera:
    "Ուղղեք տեսախցիկը դարպասի տուփի QR-ին։ Պահանջվում է HTTPS (կամ localhost)։",
  scanGateAction: "Սկանավորել QR",
  scanGateActionDemo: "Demo FREE սարք (առանց տեսախցիկի)",
  scanGateScanning: "Սկանավորում…",
  scanCameraStarting: "Տեսախցիկը միանում է…",
  scanCameraStop: "Անջատել տեսախցիկը",
  scanCameraStopped: "Տեսախցիկն անջատված է",
  scanCameraPermissionDenied:
    "Տեսախցիկի թույլտվությունը մերժված է։ Թույլատրեք կամ տեղադրեք QR հղումը ներքևում։",
  scanCameraUnavailable:
    "Տեսախցիկը հասանելի չէ։ Տեղադրեք QR հղումը կամ օգտագործեք demo կոճակը։",
  scanGateSuccess: "Սարքը գտնվեց — անվանեք դարպասը",
  scanGateNameLabel: "Դարպասի անուն",
  scanGateSave: "Ավելացնել դարպաս",
  scanGatePasteLabel: "Կամ տեղադրեք QR / հղումը",
  scanGatePasteAction: "Օգտագործել այս կոդը",
  deviceAlreadyInUse: "Այս սարքն արդեն օգտագործվում է այլ հաշվով։",
  deviceNotFound: "Սարքը տվյալների բազայում չի գտնվել։",
  deviceQrInvalid: "Անվավեր QR / զուգավորման կոդ։",
  deviceClaimFailed: "Չհաջողվեց կապել սարքը։ Փորձեք նորից։",
  toastGateAdded: (name) => `${name} ավելացվեց`,
  gateMenuHint: "Միայն այս դարպասը",
  gateRenameAction: "Վերանվանել",
  gateRenameLabel: "Դարպասի անուն",
  gateResetAction: "Վերակայել Wi‑Fi և մաքրել բաժանումները",
  gateResetConfirm: (name) =>
    `Վերակայե՞լ միայն «${name}»-ը։ Կջնջվի այս դարպասի Wi‑Fi‑ը և իր բաժանված օգտատերերը։ Մյուս դարպասները չեն փոխվի։`,
  gateRemoveAction: "Հեռացնել իմ հաշվից",
  gateRemoveConfirm: (name) =>
    `Հեռացնե՞լ «${name}»-ը ձեր հաշվից։ Կմաքրվեն միայն իր բաժանված օգտատերերը։ Մյուս դարպասները կմնան։`,
  toastGateRenamed: "Անունը փոխվեց",
  toastGateRemoved: "Դարպասը հեռացվեց",
  guestViewSubtitle: "Համօգտագործված մուտք — միայն բացել/փակել",
  previewGuestView: "Տեսնել հյուրի էկրանը",
  changeAccess: "Փոփոխել",
  editAccessTitle: "Փոփոխել մուտքը",
  saveAccessChanges: "Պահպանել",
  toastAccessUpdated: "Մուտքը թարմացվեց",
  shareAgain: "Ուղարկել",
  practiceMode: "Ցուցադրում",
  connected: "Միացված է",
  connecting: "Միանում է…",
  offline: "Անջատված",
  tabControl: "Իմ դարպասները",
  tabControlHint: "Բացել, փակել, կանգ",
  tabShare: "Այլ կառավարողներ",
  tabShareHint: "Ով կարող է կառավարել",
  controllersTitle: "Այլ կառավարողներ",
  controllersIntro:
    "Մարդիկ, ովքեր կարող են բացել այս դարպասը։ Յուրաքանչյուր դարպաս ունի իր անդամների ցանկը — չեն խառնվում։",
  addController: "Ավելացնել",
  removeController: "Հեռացնել",
  viewHistory: "Բացելու/Փակելու պատմություն",
  historyTitle: "Ով երբ բացեց կամ փակեց",
  historyEmpty: "Դեռ պատմություն չկա",
  historyOpen: "Բացեց",
  historyClose: "Փակեց",
  controllerName: "Անուն",
  controllerNamePlaceholder: "օր. Անի, առաքիչ, հյուր",
  saveController: "Պահպանել",
  accessDurationLabel: "Որքան ժամանակ?",
  ruleUnlimited: "Անսահմանափակ",
  ruleUnlimitedHint: "Կին, ընտանիք — միշտ",
  ruleOnce: "Մեկ անգամ",
  ruleOnceHint: "Մեկ անգամ, հետո ավարտ",
  rule1h: "1 ժամ",
  rule24h: "24 ժամ",
  rule7d: "7 օր",
  ruleFromTo: "Սկիզբ – ավարտ",
  ruleFromToHint: "Ընտրեք ամսաթվերը",
  fromDate: "Սկիզբ",
  toDate: "Ավարտ",
  fromTime: "Սկզբի ժամ",
  toTime: "Ավարտի ժամ",
  timeNow: "Այժմ",
  hourColumn: "Ժամ",
  minuteColumn: "Րոպե",
  noControllers: "Դեռ ոչ ոք չունի մուտք",
  toastControllerAdded: "Մուտքը ավելացվեց",
  toastControllerRemoved: "Մուտքը հեռացվեց",
  shareInviteTitle: "Ուղարկել հրավերը",
  shareInviteIntro:
    "QR-ը ներքևում է (նույն հղումը). WhatsApp-ը ուղարկում է տեքստ հղումը — QR նկարի համար սեղմեք «Ուղարկել QR-ը».",
  shareInviteIntroDemo:
    "Ցույց տվեք QR-ը, WhatsApp-ը և հյուրի ekranը.",
  shareViaWhatsApp: "Ուղարկել հղումը WhatsApp-ով",
  copyInviteLink: "Պատճենել հղումը",
  copiedInviteLink: "Հղումը պատճենվեց",
  inviteQrHint: "Սկանավորեք QR կոդը նոր կառավարողի հեռախոսահամարով։",
  shareQrImage: "Ուղարկել QR-ը",
  shareQrSaved: "QR-ը պահպանվեց — կցեք WhatsApp չatում",
  shareDone: "Պատրաստ",
  inviteLoading: "Մուտքը ստուգվում է…",
  inviteInvalid: "Հղումը անվավեր է։",
  inviteExpired: "Մուտքի ժամկետը ավարտվել է։",
  inviteRevoked: "Սեփականատերը հանել է այս մուտքը։",
  inviteNotStarted: "Մուտքը դեռ չի սկսվել։",
  inviteUsed: "Մեկանգամյա հղումը արդեն օգտագործվել է։",
  inviteOtherDevice:
    "Այս հղումը արդեն ակտիվ է մեկ այլ հ telefoni-ում։ Խնդրեք ադմինին նոր հրավեր։",
  inviteWelcome: (name) => `Ողջու՜յն, ${name}`,
  gateStatusNow: "Այս պահին դուռը",
  pleaseWait: "Խնդրում ենք սպասել…",
  tapButton: "Սեղմեք կոճակը",
  open: "Բացել",
  openHint: "Բացել դուռը",
  close: "Փակել",
  closeHint: "Փակել դուռը",
  stop: "Կանգ",
  stopHint: "Դուռը կանգնեցված է? Սեղմեք այստեղ",
  shareTitle: "Ուղարկել հյուրին",
  shareIntro:
    "Ստեղծեք հղում և ուղարկեք WhatsApp-ով, SMS-ով կամ ցանկացած չատով։ Հյուրը բացում է հղումը — այս հավելվածը նրան պետք չէ։",
  step1: "Քայլ 1 — Որքան ժամանակ?",
  step2: "Քայլ 2 — Ուղարկեք սա",
  qrHint: "Հյուրը կարող է QR կոդը կարդալ հ telefoni խցիկով",
  copyLink: "Պատճենել հղումը",
  copiedLink: "Պատճենվեց! Այժմ տեղադրեք չատում",
  whatsappTip:
    "Հուշում. Պատճենելուց հետո բացեք WhatsApp → ընտրեք անձին → երկար սեղմեք → Տեղադրել → Ուղարկել։",
  duration1h: "1 ժամ",
  duration24h: "24 ժամ",
  durationOnce: "Մեկ անգամ",
  durationHint1h: "Կարճ այցի համար",
  durationHint24h: "Առաքում կամ հյուրի համար",
  durationHintOnce: "Հղումը աշխատում է մեկ անգամ",
  gateNotConnected:
    "Դուռը միացված չէ։ Ստուգեք Wi‑Fi‑ը և MQTT‑ն (նույնը, ինչ ESP‑ում)։",
  mockModeHint:
    "Փորձարկման ռեժիմը միացված է — կոճակները փոխում են միայն նկարը, ոչ թե իրական դուռը։",
  toastOpening: "Դուռը բացվում է…",
  toastClosing: "Դուռը փակվում է…",
  toastStopped: "Դուռը կանգնեցվեց",
  toastCommandFailed: "Դուռին հասանելի չէ — ստուգեք MQTT կապը",
  toastRevoked: "Մուտքը չեղարկվեց",
  moreOptions: "Լրացուցիչ (կառավարիչների համար)",
  settings: "Կարգավորումներ",
  settingsClose: "Պատրաստ",
  back: "Հետ",
  language: "Լեզու",
  mockMode: "Փորձարկել առանց իրական դռի",
  exitDemoMode: "Ցուցադրական ռեժիմ (սիմուլյացիա)",
  exitDemoModeDescription:
    "Անջատեք՝ իրական դուռը MQTT-ով կառավարելու համար։",
  mockModeDescription:
    "Օգտագործեք սովորելու համար։ Կոճակները չեն կառավարի իրական դուռը։",
  resetDevice: "Վերակայել դարպասի Wi‑Fi",
  darkMode: "Մուգ ռեժիմ",
  biometricLock: "Face ID / մատնահետք",
  biometricLockHint:
    "Բացեք Touch SmartGate-ը Face ID-ով կամ մատնահետքով։",
  biometricUnlock: "Բացել Face ID / մատնահետքով",
  biometricChecking: "Ստուգում…",
  biometricDescription:
    "Պահանջել Face ID կամ մատնահետք հավելվածը բացելիս և մուտք կիսելիս։",
  biometricNotSupported:
    "Face ID / մատնահետքը հասանելի չէ այս սարքում կամ բրաուզերում։",
  biometricEnabledToast: "Face ID / մատնահետքը միացված է",
  biometricDisabledToast: "Face ID / մատնահետքը անջատված է",
  biometricCancelled: "Չեղարկվեց — գործողությունը չի թույլատրվում",
  biometricFailed: "Չհաջողվեց հաստատել Face ID / մատնահետքը",
  wifiSetupTitle: "Կարգավորել դարպասի Wi‑Fi",
  wifiSetupMenuHint: "Նոր սարք · SoftAP հեռախոսով",
  wifiSetupIntro:
    "Վահանակը ստեղծում է ժամանակավոր Wi‑Fi, որ տաք ձեր տան ցանցը — մալուխ պետք չէ։",
  wifiSetupStep1: "Միացրեք սնուցումը։ Արագ թարթող LED = սպասում է կարգավորման։",
  wifiSetupStep2: "Հեռախոսով միացեք TouchGate-XXXX Wi‑Fi-ին (բաց ցանց)։",
  wifiSetupStep3: "Բրաուզերում բացեք http://192.168.4.1 (կամ սպասեք էջին)։",
  wifiSetupStep4: "Ցանկից ընտրեք տան Wi‑Fi‑ը, մուտքագրեք գաղտնաբառը → Save & Connect։",
  wifiSetupStep5: "Հեռախոսը վերադարձրեք տան Wi‑Fi։ LED-ը կայուն է, ապա սկանավորեք QR-ը հավելվածում։",
  wifiSetupReset:
    "Սխալ Wi‑Fi՞։ Դարպասի քարտի ⚙ կամ Կարգավորումներ → Վերակայել։ Մաքրում է միայն այդ դարպասի բաժանումները և SoftAP։ Մյուս դարպասները մնում են։",
  wifiResetAction: "Վերակայել ընտրված դարպասը",
  wifiResetConfirm:
    "Վերակայե՞լ միայն ընտրված դարպասը։ Կջնջվի նրա Wi‑Fi‑ը և իր բաժանված անդամները։ Մյուս դարպասները չեն փոխվի։",
  wifiResetSentToast:
    "Reset ուղարկվեց այս դարպասին — միացեք TouchGate-XXXX, բացեք 192.168.4.1",
  wifiResetNeedMqtt: "Նախ միացեք դռանը (MQTT), ապա վերակայեք։",
  mqttSettingsTitle: "MQTT (դռան կապ)",
  mqttSettingsHint:
    "Նույն HiveMQ host, username և password, ինչ ESP config.h-ում / հին հավելվածի կարգավորումներում։",
  mqttHost: "Broker host",
  mqttUser: "Username",
  mqttPass: "Password",
  mqttSave: "Պահել և միանալ",
  mqttSavedToast: "MQTT-ը պահվեց — միանում է…",
  forDevelopers: "Ծրագրավորողների համար",
  connectSpecialist: "Միանալ սպասարկող մասնագետին",
  toastSpecialistRequested: "Մասնագետը շուտով կկապվի ձեզ հետ",
  creditBefore: "Համակարգը մշակվել է և սպասարկվում է ",
  creditAfter: "-ի կողմից",
  authLoading: "Պրոֆիլը բեռնվում է…",
  authProfileTitle: "Ձեր պրոֆիլը",
  authProfileHint:
    "Ձեր դարպասները կապված են այս էլ․ փոստին։ Gmail, iCloud, Outlook կամ այլ։",
  authNameLabel: "Ձեր անունը",
  authNamePlaceholder: "օր. Աշոտ",
  authNameSave: "Պահել անունը",
  authNameSaving: "Պահվում է…",
  authNameNeededHint: "Ավելացրեք անունը, որ հրավերներում երևա ով է կիսել մուտքը։",
  authNameRequired: "Մուտքագրեք անունը։",
  authNameSaveFailed: "Չհաջողվեց պահել անունը։",
  authNameSavedToast: "Անունը պահվեց",
  authNameSavedHint:
    "Պատրաստ է։ Փակեք Կարգավորումները, ապա ավելացրեք դարպասը QR‑ով։",
  authSignOut: "Դուրս գալ",
  authSignInTitle: "Մուտք",
  authSignInHint:
    "Մուտքագրեք էլ․ փոստը (Gmail, iCloud, Outlook…)։ Կուղարկենք 6‑անիշ կոդ — գաղտնաբառ պետք չէ։",
  authEmailPlaceholder: "you@gmail.com",
  authSendCode: "Ուղարկել կոդը",
  authSending: "Ուղարկվում է…",
  authCodeSentTo: (email) => `Կոդն ուղարկվել է ${email}`,
  authCodePlaceholder: "000000",
  authVerifyCode: "Հաստատել և մտնել",
  authVerifying: "Ստուգում…",
  authChangeEmail: "Այլ էլ․ փոստ",
  authDevCodeHint: (code) => `Dev ռեժիմ — ձեր կոդը ${code}`,
  authInvalidEmail: "Մուտքագրեք վավեր էլ․ փոստ։",
  authRateLimited: "Սպասեք մի պահ, ապա նորից խնդրեք կոդ։",
  authRateLimitedWait: (sec) => `Սպասեք ${sec} վրկ, ապա նորից խնդրեք կոդ։`,
  authSendFailed: "Չհաջողվեց ուղարկել։ Փորձեք նորից։",
  authCheckSpamHint:
    "Նամակ չկա՞ Ստուգեք Spam / Առաջարկներ։ Թեման՝ «SmartGate login code».",
  authInvalidCode: "Սխալ կամ ժամկետանց կոդ։",
  authCodeSentToast: "Ստուգեք էլ․ փոստը կոդի համար",
  authSignedInToast: "Մուտք գործեցիք",
  authSignedOutToast: "Դուրս եկաք",
  authRequiredToClaim: "Նախ Settings‑ից մուտք գործեք, ապա կապեք դարպասը։",
  gateStates: {
    closed: "Դարպասը փակ է",
    open: "Դարպասը բաց է",
    opening: "Դարպասը բացվում է…",
    closing: "Դարպասը փակվում է…",
    stopped: "Դարպասը կանգնեցված է",
    unknown: "Անհայտ",
  },
};

const ru: SmartGateMessages = {
  appTitle: "Touch SmartGate",
  presentationBadge: "Демо — имитация ворот",
  selectGate: "Ворота",
  myGates: "Мои ворота",
  addGate: "Добавить",
  scanGateTitle: "Сканировать QR-код",
  scanGateHint:
    "Наведите телефон на QR-код пульта или блока управления воротами, чтобы добавить их.",
  scanGateHintDb:
    "Отсканируйте или вставьте заводской QR. Свободное устройство можно забрать один раз — занятое отклоняется.",
  scanGateHintCamera:
    "Наведите камеру на QR на корпусе ворот. Нужен HTTPS (или localhost).",
  scanGateAction: "Сканировать QR",
  scanGateActionDemo: "Demo FREE устройство (без камеры)",
  scanGateScanning: "Сканирование…",
  scanCameraStarting: "Включение камеры…",
  scanCameraStop: "Остановить камеру",
  scanCameraStopped: "Камера выключена",
  scanCameraPermissionDenied:
    "Нет доступа к камере. Разрешите камеру для сайта или вставьте ссылку QR ниже.",
  scanCameraUnavailable:
    "Камера недоступна. Вставьте ссылку QR или нажмите demo.",
  scanGateSuccess: "Устройство найдено — назовите ворота",
  scanGateNameLabel: "Название ворот",
  scanGateSave: "Добавить ворота",
  scanGatePasteLabel: "Или вставьте QR / ссылку",
  scanGatePasteAction: "Использовать этот код",
  deviceAlreadyInUse: "Это устройство уже используется другим аккаунтом.",
  deviceNotFound: "Устройство не найдено в базе.",
  deviceQrInvalid: "Неверный QR / код привязки.",
  deviceClaimFailed: "Не удалось привязать устройство. Попробуйте снова.",
  toastGateAdded: (name) => `${name} добавлены`,
  gateMenuHint: "Только эти ворота",
  gateRenameAction: "Переименовать",
  gateRenameLabel: "Название ворот",
  gateResetAction: "Сбросить Wi‑Fi и доступы",
  gateResetConfirm: (name) =>
    `Сбросить только «${name}»? Очистится Wi‑Fi этих ворот и их общие пользователи. Другие ворота не затронуты.`,
  gateRemoveAction: "Удалить из моего аккаунта",
  gateRemoveConfirm: (name) =>
    `Удалить «${name}» из аккаунта? Очистятся только их общие пользователи. Другие ворота останутся.`,
  toastGateRenamed: "Название изменено",
  toastGateRemoved: "Ворота удалены",
  guestViewSubtitle: "Общий доступ — только открыть/закрыть",
  previewGuestView: "Экран гостя",
  changeAccess: "Изменить",
  editAccessTitle: "Изменить доступ",
  saveAccessChanges: "Сохранить",
  toastAccessUpdated: "Доступ обновлён",
  shareAgain: "Отправить",
  practiceMode: "Демо",
  connected: "Подключено",
  connecting: "Подключение…",
  offline: "Не в сети",
  tabControl: "Мои ворота",
  tabControlHint: "Открыть, закрыть, стоп",
  tabShare: "Другие пользователи",
  tabShareHint: "Кто может управлять",
  controllersTitle: "Другие пользователи",
  controllersIntro:
    "Люди, которые могут открывать эти ворота. У каждых ворот свой список — они не смешиваются.",
  addController: "Добавить",
  removeController: "Удалить",
  viewHistory: "История открытий",
  historyTitle: "Кто и когда управлял",
  historyEmpty: "История пока пуста",
  historyOpen: "Открыл",
  historyClose: "Закрыл",
  controllerName: "Имя",
  controllerNamePlaceholder: "напр. Анна, курьер, гость",
  saveController: "Сохранить",
  accessDurationLabel: "На сколько?",
  ruleUnlimited: "Без ограничений",
  ruleUnlimitedHint: "Супруг, семья — всегда",
  ruleOnce: "Один раз",
  ruleOnceHint: "Работает один раз, затем истекает",
  rule1h: "1 час",
  rule24h: "24 часа",
  rule7d: "7 дней",
  ruleFromTo: "С — по",
  ruleFromToHint: "Выберите даты начала и конца",
  fromDate: "С",
  toDate: "По",
  fromTime: "Время начала",
  toTime: "Время окончания",
  timeNow: "Сейчас",
  hourColumn: "Час",
  minuteColumn: "Мин",
  noControllers: "Пока никому не выдан доступ",
  toastControllerAdded: "Доступ добавлен",
  toastControllerRemoved: "Доступ удалён",
  shareInviteTitle: "Отправить приглашение",
  shareInviteIntro:
    "QR-код ниже (та же ссылка). WhatsApp отправляет текстовую ссылку — для QR нажмите «Отправить QR».",
  shareInviteIntroDemo:
    "Покажите партнёру, как работает доступ — QR, WhatsApp или экран гостя.",
  shareViaWhatsApp: "Отправить ссылку в WhatsApp",
  copyInviteLink: "Копировать ссылку",
  copiedInviteLink: "Ссылка скопирована",
  inviteQrHint: "Сканируйте QR-код камерой телефона нового пользователя.",
  shareQrImage: "Отправить QR",
  shareQrSaved: "QR сохранён — прикрепите в чат WhatsApp",
  shareDone: "Готово",
  inviteLoading: "Проверка доступа…",
  inviteInvalid: "Ссылка недействительна.",
  inviteExpired: "Срок доступа истёк.",
  inviteRevoked: "Владелец удалил этот доступ.",
  inviteNotStarted: "Доступ ещё не начался.",
  inviteUsed: "Одноразовая ссылка уже использована.",
  inviteOtherDevice:
    "Ссылка уже активна на другом телефоне. Попросите администратора новое приглашение.",
  inviteWelcome: (name) => `Здравствуйте, ${name}`,
  gateStatusNow: "Сейчас ворота",
  pleaseWait: "Подождите…",
  tapButton: "Нажмите кнопку",
  open: "Открыть",
  openHint: "Поднять ворота",
  close: "Закрыть",
  closeHint: "Опустить ворота",
  stop: "Стоп",
  stopHint: "Ворота застряли? Нажмите здесь",
  shareTitle: "Поделиться с гостем",
  shareIntro:
    "Создайте ссылку и отправьте через WhatsApp, SMS или любой чат. Гость открывает ссылку — приложение не нужно.",
  step1: "Шаг 1 — На сколько?",
  step2: "Шаг 2 — Отправьте это",
  qrHint: "Гость может отсканировать QR-код камерой телефона",
  copyLink: "Копировать ссылку",
  copiedLink: "Скопировано! Вставьте в чат",
  whatsappTip:
    "Подсказка: после копирования откройте WhatsApp → выберите человека → долгое нажатие → Вставить → Отправить.",
  duration1h: "1 час",
  duration24h: "24 часа",
  durationOnce: "Один раз",
  durationHint1h: "Для короткого визита",
  durationHint24h: "Для доставки или гостя сегодня",
  durationHintOnce: "Ссылка работает один раз",
  gateNotConnected:
    "Ворота не подключены. Проверьте Wi‑Fi и MQTT (тот же брокер, что на ESP).",
  mockModeHint:
    "Демо-режим включён — кнопки меняют только картинку на экране, не реальные ворота.",
  toastOpening: "Открываем ворота…",
  toastClosing: "Закрываем ворота…",
  toastStopped: "Ворота остановлены",
  toastCommandFailed: "Нет связи с воротами — проверьте MQTT",
  toastRevoked: "Доступ отменён",
  moreOptions: "Дополнительно (для управляющих)",
  settings: "Настройки",
  settingsClose: "Готово",
  back: "Назад",
  language: "Язык",
  mockMode: "Пробовать без реальных ворот (демо)",
  mockModeDescription:
    "Для обучения. Кнопки не будут управлять реальными воротами.",
  exitDemoMode: "Демо-режим (симуляция)",
  exitDemoModeDescription:
    "Выключите, чтобы управлять реальными воротами по MQTT.",
  resetDevice: "Сбросить Wi‑Fi ворот",
  darkMode: "Тёмная тема",
  biometricLock: "Face ID / отпечаток",
  biometricLockHint:
    "Подтвердите Face ID или отпечатком, чтобы открыть Touch SmartGate.",
  biometricUnlock: "Разблокировать Face ID / отпечатком",
  biometricChecking: "Проверка…",
  biometricDescription:
    "Требовать Face ID или отпечаток при открытии приложения и перед общим доступом.",
  biometricNotSupported:
    "Face ID / отпечаток недоступен на этом устройстве или в браузере.",
  biometricEnabledToast: "Face ID / отпечаток включён",
  biometricDisabledToast: "Face ID / отпечаток выключен",
  biometricCancelled: "Отменено — действие не разрешено",
  biometricFailed: "Не удалось подтвердить Face ID / отпечаток",
  wifiSetupTitle: "Настроить Wi‑Fi ворот",
  wifiSetupMenuHint: "Новый блок · SoftAP с телефона",
  wifiSetupIntro:
    "Контроллер создаёт временный Wi‑Fi, чтобы вы передали домашнюю сеть — без кабеля.",
  wifiSetupStep1: "Включите питание. Быстрое мигание LED = ждёт настройку.",
  wifiSetupStep2: "На телефоне подключитесь к Wi‑Fi TouchGate-XXXX (открытая сеть).",
  wifiSetupStep3: "Откройте http://192.168.4.1 в браузере (или дождитесь страницы).",
  wifiSetupStep4: "Выберите домашний Wi‑Fi из списка, введите пароль → Save & Connect.",
  wifiSetupStep5: "Верните телефон в домашний Wi‑Fi. LED горит ровно — сканируйте QR в приложении.",
  wifiSetupReset:
    "Неверный Wi‑Fi? Шестерёнка на карточке ворот (или Настройки → Сброс). Очищает только доступы этих ворот и SoftAP. Другие ворота остаются.",
  wifiResetAction: "Сбросить выбранные ворота",
  wifiResetConfirm:
    "Сбросить только выбранные ворота? Очистится их Wi‑Fi и их общие пользователи. Другие ворота не затронуты.",
  wifiResetSentToast:
    "Сброс отправлен для этих ворот — подключитесь к TouchGate-XXXX, откройте 192.168.4.1",
  wifiResetNeedMqtt: "Сначала подключитесь к воротам (MQTT), затем сбрасывайте.",
  mqttSettingsTitle: "MQTT (связь с воротами)",
  mqttSettingsHint:
    "Тот же HiveMQ host, username и password, что в ESP config.h / старом приложении.",
  mqttHost: "Broker host",
  mqttUser: "Username",
  mqttPass: "Password",
  mqttSave: "Сохранить и подключить",
  mqttSavedToast: "MQTT сохранён — подключаемся…",
  forDevelopers: "Для разработчиков",
  connectSpecialist: "Связаться со специалистом",
  toastSpecialistRequested: "Специалист скоро свяжется с вами",
  creditBefore: "Система разработана и обслуживается ",
  creditAfter: "",
  authLoading: "Загрузка профиля…",
  authProfileTitle: "Ваш профиль",
  authProfileHint:
    "Ворота привязаны к этому email. Gmail, iCloud Mail, Outlook или любой другой.",
  authNameLabel: "Ваше имя",
  authNamePlaceholder: "напр. Ашот",
  authNameSave: "Сохранить имя",
  authNameSaving: "Сохранение…",
  authNameNeededHint: "Укажите имя — в приглашениях будет видно, кто дал доступ.",
  authNameRequired: "Введите имя.",
  authNameSaveFailed: "Не удалось сохранить имя.",
  authNameSavedToast: "Имя сохранено",
  authNameSavedHint:
    "Готово. Закройте настройки и добавьте ворота по QR со стикера.",
  authSignOut: "Выйти",
  authSignInTitle: "Вход",
  authSignInHint:
    "Введите email (Gmail, iCloud, Outlook…). Пришлём 6‑значный код — без пароля.",
  authEmailPlaceholder: "you@gmail.com",
  authSendCode: "Отправить код",
  authSending: "Отправка…",
  authCodeSentTo: (email) => `Код отправлен на ${email}`,
  authCodePlaceholder: "000000",
  authVerifyCode: "Подтвердить и войти",
  authVerifying: "Проверка…",
  authChangeEmail: "Другой email",
  authDevCodeHint: (code) => `Dev‑режим — ваш код ${code}`,
  authInvalidEmail: "Введите корректный email.",
  authRateLimited: "Подождите немного и запросите код снова.",
  authRateLimitedWait: (sec) => `Подождите ${sec} с и запросите код снова.`,
  authSendFailed: "Не удалось отправить письмо. Попробуйте ещё раз.",
  authCheckSpamHint:
    "Нет письма? Проверьте Спам / Промоакции. Тема: «SmartGate login code».",
  authInvalidCode: "Неверный или просроченный код.",
  authCodeSentToast: "Проверьте почту — там код",
  authSignedInToast: "Вы вошли",
  authSignedOutToast: "Вы вышли",
  authRequiredToClaim: "Сначала войдите в Settings, затем привяжите ворота.",
  gateStates: {
    closed: "Ворота закрыты",
    open: "Ворота открыты",
    opening: "Ворота открываются…",
    closing: "Ворота закрываются…",
    stopped: "Ворота остановлены",
    unknown: "Статус неизвестен",
  },
};

export const messages: Record<Locale, SmartGateMessages> = { en, hy, ru };

export const SUPPORTED_LOCALES: Locale[] = ["hy", "en", "ru"];

export function getGuestPassDurationLabel(
  locale: Locale,
  duration: GuestPassDuration,
): string {
  const m = messages[locale];
  if (duration === "1h") return m.duration1h;
  if (duration === "24h") return m.duration24h;
  return m.durationOnce;
}

export function getGuestPassDurationHint(
  locale: Locale,
  duration: GuestPassDuration,
): string {
  const m = messages[locale];
  if (duration === "1h") return m.durationHint1h;
  if (duration === "24h") return m.durationHint24h;
  return m.durationHintOnce;
}

export const localeLabels: Record<Locale, string> = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
};

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "hy";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "hy" || stored === "ru" ? stored : "hy";
}

export function storeLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
