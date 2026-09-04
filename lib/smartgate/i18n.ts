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
  scanGateAction: string;
  scanGateScanning: string;
  scanGateSuccess: string;
  scanGateNameLabel: string;
  scanGateSave: string;
  toastGateAdded: (name: string) => string;
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
  forDevelopers: string;
  connectSpecialist: string;
  toastSpecialistRequested: string;
  creditBefore: string;
  creditAfter: string;
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
  scanGateAction: "Scan QR code",
  scanGateScanning: "Scanning…",
  scanGateSuccess: "Device found — name your gate",
  scanGateNameLabel: "Gate name",
  scanGateSave: "Add gate",
  toastGateAdded: (name) => `${name} added`,
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
    "People who can open or close your gate from their phone.",
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
    "Gate not connected yet. Turn on Mock Mode in Settings (gear icon) to try the buttons.",
  mockModeHint:
    "Mock mode is on — buttons only change the picture on screen, not your real gate.",
  toastOpening: "Opening gate…",
  toastClosing: "Closing gate…",
  toastStopped: "Gate stopped",
  toastCommandFailed: "Cannot reach gate — turn on Mock Mode or check connection",
  toastRevoked: "Access revoked",
  moreOptions: "More options (for property managers)",
  settings: "Settings",
  settingsClose: "Done",
  back: "Back",
  language: "Language",
  mockMode: "Try without real gate (mock mode)",
  mockModeDescription:
    "Use this to practice. Buttons will not control your real gate.",
  resetDevice: "Restart device (reset)",
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
  forDevelopers: "For developers",
  connectSpecialist: "Contact a service specialist",
  toastSpecialistRequested: "A specialist will contact you shortly",
  creditBefore: "System developed and maintained by ",
  creditAfter: "",
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
  scanGateAction: "Սկանավորել QR",
  scanGateScanning: "Սկանավորում…",
  scanGateSuccess: "Սարքը գտնվեց — անվանեք դարպասը",
  scanGateNameLabel: "Դարպասի անուն",
  scanGateSave: "Ավելացնել դարպաս",
  toastGateAdded: (name) => `${name} ավելացվեց`,
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
    "Մարդիկ, ովքեր կարող են բացել | փակել դարպասն իրենց հեռախոսով",
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
    "Դուռը դեռ միացված չէ։ Կարգավորումներում (անիվ) միացրեք Փորձարկման ռեժիմը։",
  mockModeHint:
    "Փորձարկման ռեժիմը միացված է — կոճակները փոխում են միայն նկարը, ոչ թե իրական դուռը։",
  toastOpening: "Դուռը բացվում է…",
  toastClosing: "Դուռը փակվում է…",
  toastStopped: "Դուռը կանգնեցվեց",
  toastCommandFailed: "Դուռին հասանելի չէ — միացրեք Փորձարկման ռեժիմը",
  toastRevoked: "Մուտքը չեղարկվեց",
  moreOptions: "Լրացուցիչ (կառավարիչների համար)",
  settings: "Կարգավորումներ",
  settingsClose: "Պատրաստ",
  back: "Հետ",
  language: "Լեզու",
  mockMode: "Փորձարկել առանց իրական դռի",
  mockModeDescription:
    "Օգտագործեք սովորելու համար։ Կոճակները չեն կառավարի իրական դուռը։",
  resetDevice: "Վերագործարկել սարքը (reset)",
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
  forDevelopers: "Ծրագրավորողների համար",
  connectSpecialist: "Միանալ սպասարկող մասնագետին",
  toastSpecialistRequested: "Մասնագետը շուտով կկապվի ձեզ հետ",
  creditBefore: "Համակարգը մշակվել է և սպասարկվում է ",
  creditAfter: "-ի կողմից",
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
  scanGateAction: "Сканировать QR",
  scanGateScanning: "Сканирование…",
  scanGateSuccess: "Устройство найдено — назовите ворота",
  scanGateNameLabel: "Название ворот",
  scanGateSave: "Добавить ворота",
  toastGateAdded: (name) => `${name} добавлены`,
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
    "Люди, которые могут открывать или закрывать ворота со своего телефона.",
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
    "Ворота не подключены. Включите демо-режим в настройках (шестерёнка), чтобы попробовать кнопки.",
  mockModeHint:
    "Демо-режим включён — кнопки меняют только картинку на экране, не реальные ворота.",
  toastOpening: "Открываем ворота…",
  toastClosing: "Закрываем ворота…",
  toastStopped: "Ворота остановлены",
  toastCommandFailed: "Нет связи с воротами — включите демо-режим или проверьте подключение",
  toastRevoked: "Доступ отменён",
  moreOptions: "Дополнительно (для управляющих)",
  settings: "Настройки",
  settingsClose: "Готово",
  back: "Назад",
  language: "Язык",
  mockMode: "Пробовать без реальных ворот (демо)",
  mockModeDescription:
    "Для обучения. Кнопки не будут управлять реальными воротами.",
  resetDevice: "Перезапустить устройство (reset)",
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
  forDevelopers: "Для разработчиков",
  connectSpecialist: "Связаться со специалистом",
  toastSpecialistRequested: "Специалист скоро свяжется с вами",
  creditBefore: "Система разработана и обслуживается ",
  creditAfter: "",
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
