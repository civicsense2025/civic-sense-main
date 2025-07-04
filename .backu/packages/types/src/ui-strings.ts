/**
 * CivicSense UI Strings Types
 * Types for managing UI text and localization
 */

import { SupportedLanguage } from './translations';

export interface UIStrings {
  common: {
    ok: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    retry: string;
    next: string;
    back: string;
    done: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    signup: string;
    email: string;
    password: string;
    username: string;
    search: string;
    filter: string;
    sort: string;
    clear: string;
    apply: string;
    reset: string;
    share: string;
    copy: string;
    close: string;
    open: string;
    view: string;
    hide: string;
    show: string;
    more: string;
    less: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    on: string;
    off: string;
    enabled: string;
    disabled: string;
    success: string;
    failure: string;
    warning: string;
    info: string;
    required: string;
    optional: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    now: string;
    later: string;
    never: string;
    always: string;
    menu: string;
    home: string;
    help: string;
    about: string;
    contact: string;
    support: string;
    feedback: string;
    report: string;
    submit: string;
    send: string;
    receive: string;
    update: string;
    upgrade: string;
    downgrade: string;
    install: string;
    uninstall: string;
    remove: string;
    add: string;
    create: string;
    read: string;
    write: string;
    modify: string;
    confirm: string;
    continue: string;
    skip: string;
    finish: string;
    start: string;
    stop: string;
    pause: string;
    resume: string;
    restart: string;
    refresh: string;
    reload: string;
    sync: string;
    upload: string;
    download: string;
    import: string;
    export: string;
    print: string;
    saveAs: string;
    saveAll: string;
    deleteAll: string;
    archive: string;
    unarchive: string;
    favorite: string;
    unfavorite: string;
    like: string;
    unlike: string;
    follow: string;
    unfollow: string;
    block: string;
    unblock: string;
    mute: string;
    unmute: string;
    pin: string;
    unpin: string;
    flag: string;
    unflag: string;
    mark: string;
    unmark: string;
    select: string;
    unselect: string;
    selectAll: string;
    unselectAll: string;
    expand: string;
    collapse: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    fullscreen: string;
    exitFullscreen: string;
    notifications: string;
    messages: string;
    alerts: string;
    reminders: string;
    calendar: string;
    schedule: string;
    events: string;
    tasks: string;
    projects: string;
    groups: string;
    teams: string;
    members: string;
    users: string;
    roles: string;
    permissions: string;
    preferences: string;
    options: string;
    configuration: string;
    setup: string;
    version: string;
    build: string;
    release: string;
    debug: string;
    test: string;
    production: string;
    staging: string;
    development: string;
    local: string;
    remote: string;
    cloud: string;
    offline: string;
    online: string;
    connected: string;
    disconnected: string;
    synced: string;
    unsynced: string;
    pending: string;
    processing: string;
    completed: string;
    failed: string;
    cancelled: string;
    skipped: string;
    ignored: string;
    blocked: string;
    allowed: string;
    denied: string;
    granted: string;
    revoked: string;
    expired: string;
    renewed: string;
    active: string;
    inactive: string;
    locked: string;
    unlocked: string;
    secured: string;
    unsecured: string;
    public: string;
    private: string;
    shared: string;
    personal: string;
    business: string;
    enterprise: string;
    free: string;
    paid: string;
    premium: string;
    trial: string;
    beta: string;
    alpha: string;
    stable: string;
    unstable: string;
    deprecated: string;
    experimental: string;
    custom: string;
    default: string;
    automatic: string;
    manual: string;
    other: string;
    unknown: string;
    undefined: string;
    null: string;
    empty: string;
    full: string;
    partial: string;
    complete: string;
    incomplete: string;
    valid: string;
    invalid: string;
    critical: string;
    major: string;
    minor: string;
    trivial: string;
    important: string;
    urgent: string;
    high: string;
    medium: string;
    low: string;
    some: string;
    few: string;
    many: string;
    most: string;
    least: string;
    first: string;
    last: string;
    previous: string;
    current: string;
    old: string;
    new: string;
    latest: string;
    earliest: string;
    recent: string;
    upcoming: string;
    past: string;
    future: string;
    sometimes: string;
    often: string;
    rarely: string;
    usually: string;
    occasionally: string;
    frequently: string;
    infrequently: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    hourly: string;
    minutely: string;
    secondly: string;
    instantly: string;
    immediately: string;
    eventually: string;
    soon: string;
    earlier: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    midnight: string;
    noon: string;
    dawn: string;
    dusk: string;
    sunrise: string;
    sunset: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
  };
  quiz: {
    start: string;
    next: string;
    previous: string;
    submit: string;
    correct: string;
    incorrect: string;
  };
}

export interface UIStringsService {
  getLocale(): SupportedLanguage;
  setLocale(locale: SupportedLanguage): Promise<void>;
  getUIString(path: keyof UIStrings['common'], params?: Record<string, any>): string;
}

export type UIStringPath = string

export interface UIStringService {
  getString(path: UIStringPath, params?: Record<string, string>): string
  formatString(template: string, params: Record<string, string>): string
  setStrings(strings: UIStrings): void
  getStrings(): UIStrings
}

export interface UIStringContext {
  strings: UIStrings
  getString: (path: UIStringPath, params?: Record<string, string>) => string
  formatString: (template: string, params: Record<string, string>) => string
}

export interface UIStringProviderProps {
  children: React.ReactNode
  initialStrings?: UIStrings
} 