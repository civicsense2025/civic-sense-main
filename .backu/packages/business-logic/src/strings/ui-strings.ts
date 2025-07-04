/**
 * CivicSense UI Strings Interface
 * This file contains all user-facing text strings used throughout the application.
 * It serves as the single source of truth for UI text and facilitates translation.
 */

import { type UIStrings } from '@civicsense/types'
import { SupportedLanguage } from '@civicsense/types'

export const uiStrings: UIStrings = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    next: 'Next',
    back: 'Back',
    done: 'Done',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    apply: 'Apply',
    reset: 'Reset',
    share: 'Share',
    copy: 'Copy',
    close: 'Close',
    open: 'Open',
    view: 'View',
    hide: 'Hide',
    show: 'Show',
    more: 'More',
    less: 'Less',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    on: 'On',
    off: 'Off',
    enabled: 'Enabled',
    disabled: 'Disabled',
    success: 'Success',
    failure: 'Failure',
    warning: 'Warning',
    info: 'Info',
    required: 'Required',
    optional: 'Optional',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    now: 'Now',
    later: 'Later',
    never: 'Never',
    always: 'Always',
    menu: 'Menu',
    home: 'Home',
    help: 'Help',
    about: 'About',
    contact: 'Contact',
    support: 'Support',
    feedback: 'Feedback',
    report: 'Report',
    submit: 'Submit',
    send: 'Send',
    receive: 'Receive',
    update: 'Update',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    install: 'Install',
    uninstall: 'Uninstall',
    remove: 'Remove',
    add: 'Add',
    create: 'Create',
    read: 'Read',
    write: 'Write',
    modify: 'Modify',
    confirm: 'Confirm',
    continue: 'Continue',
    skip: 'Skip',
    finish: 'Finish',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    refresh: 'Refresh',
    reload: 'Reload',
    sync: 'Sync',
    upload: 'Upload',
    download: 'Download',
    import: 'Import',
    export: 'Export',
    print: 'Print',
    saveAs: 'Save As',
    saveAll: 'Save All',
    deleteAll: 'Delete All',
    archive: 'Archive',
    unarchive: 'Unarchive',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    like: 'Like',
    unlike: 'Unlike',
    follow: 'Follow',
    unfollow: 'Unfollow',
    block: 'Block',
    unblock: 'Unblock',
    mute: 'Mute',
    unmute: 'Unmute',
    pin: 'Pin',
    unpin: 'Unpin',
    flag: 'Flag',
    unflag: 'Unflag',
    mark: 'Mark',
    unmark: 'Unmark',
    select: 'Select',
    unselect: 'Unselect',
    selectAll: 'Select All',
    unselectAll: 'Unselect All',
    expand: 'Expand',
    collapse: 'Collapse',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    notifications: 'Notifications',
    messages: 'Messages',
    alerts: 'Alerts',
    reminders: 'Reminders',
    calendar: 'Calendar',
    schedule: 'Schedule',
    events: 'Events',
    tasks: 'Tasks',
    projects: 'Projects',
    groups: 'Groups',
    teams: 'Teams',
    members: 'Members',
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
    preferences: 'Preferences',
    options: 'Options',
    configuration: 'Configuration',
    setup: 'Setup',
    version: 'Version',
    build: 'Build',
    release: 'Release',
    debug: 'Debug',
    test: 'Test',
    production: 'Production',
    staging: 'Staging',
    development: 'Development',
    local: 'Local',
    remote: 'Remote',
    cloud: 'Cloud',
    offline: 'Offline',
    online: 'Online',
    connected: 'Connected',
    disconnected: 'Disconnected',
    synced: 'Synced',
    unsynced: 'Unsynced',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    skipped: 'Skipped',
    ignored: 'Ignored',
    blocked: 'Blocked',
    allowed: 'Allowed',
    denied: 'Denied',
    granted: 'Granted',
    revoked: 'Revoked',
    expired: 'Expired',
    renewed: 'Renewed',
    active: 'Active',
    inactive: 'Inactive',
    locked: 'Locked',
    unlocked: 'Unlocked',
    secured: 'Secured',
    unsecured: 'Unsecured',
    public: 'Public',
    private: 'Private',
    shared: 'Shared',
    personal: 'Personal',
    business: 'Business',
    enterprise: 'Enterprise',
    free: 'Free',
    paid: 'Paid',
    premium: 'Premium',
    trial: 'Trial',
    beta: 'Beta',
    alpha: 'Alpha',
    stable: 'Stable',
    unstable: 'Unstable',
    deprecated: 'Deprecated',
    experimental: 'Experimental',
    custom: 'Custom',
    default: 'Default',
    automatic: 'Automatic',
    manual: 'Manual',
    other: 'Other',
    unknown: 'Unknown',
    undefined: 'Undefined',
    null: 'Null',
    empty: 'Empty',
    full: 'Full',
    partial: 'Partial',
    complete: 'Complete',
    incomplete: 'Incomplete',
    valid: 'Valid',
    invalid: 'Invalid',
    critical: 'Critical',
    major: 'Major',
    minor: 'Minor',
    trivial: 'Trivial',
    important: 'Important',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    some: 'Some',
    few: 'Few',
    many: 'Many',
    most: 'Most',
    least: 'Least',
    first: 'First',
    last: 'Last',
    previous: 'Previous',
    current: 'Current',
    old: 'Old',
    new: 'New',
    latest: 'Latest',
    earliest: 'Earliest',
    recent: 'Recent',
    upcoming: 'Upcoming',
    past: 'Past',
    future: 'Future',
    sometimes: 'Sometimes',
    often: 'Often',
    rarely: 'Rarely',
    usually: 'Usually',
    occasionally: 'Occasionally',
    frequently: 'Frequently',
    infrequently: 'Infrequently',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    hourly: 'Hourly',
    minutely: 'Minutely',
    secondly: 'Secondly',
    instantly: 'Instantly',
    immediately: 'Immediately',
    eventually: 'Eventually',
    soon: 'Soon',
    earlier: 'Earlier',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    midnight: 'Midnight',
    noon: 'Noon',
    dawn: 'Dawn',
    dusk: 'Dusk',
    sunrise: 'Sunrise',
    sunset: 'Sunset'
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password'
  },
  quiz: {
    start: 'Start Quiz',
    next: 'Next Question',
    previous: 'Previous Question',
    submit: 'Submit Answers',
    correct: 'Correct!',
    incorrect: 'Incorrect'
  }
}

export type UIStringKey = keyof typeof uiStrings

export type UIStringPath = 
  | 'common.ok'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.loading'
  | 'common.error'
  | 'common.retry'
  | 'common.next'
  | 'common.back'
  | 'common.done'
  | 'common.settings'
  | 'common.profile'
  | 'common.logout'
  | 'common.login'
  | 'common.signup'
  | 'common.email'
  | 'common.password'
  | 'common.username'
  | 'common.search'
  | 'common.filter'
  | 'common.sort'
  | 'common.clear'
  | 'common.apply'
  | 'common.reset'
  | 'common.share'
  | 'common.copy'
  | 'common.close'
  | 'common.open'
  | 'common.view'
  | 'common.hide'
  | 'common.show'
  | 'common.more'
  | 'common.less'
  | 'common.all'
  | 'common.none'
  | 'common.yes'
  | 'common.no'
  | 'common.on'
  | 'common.off'
  | 'common.enabled'
  | 'common.disabled'
  | 'common.success'
  | 'common.failure'
  | 'common.warning'
  | 'common.info'
  | 'common.required'
  | 'common.optional'
  | 'common.today'
  | 'common.yesterday'
  | 'common.tomorrow'
  | 'common.now'
  | 'common.later'
  | 'common.never'
  | 'common.always'
  | 'common.menu'
  | 'common.home'
  | 'common.help'
  | 'common.about'
  | 'common.contact'
  | 'common.support'
  | 'common.feedback'
  | 'common.report'
  | 'common.submit'
  | 'common.send'
  | 'common.receive'
  | 'common.update'
  | 'common.upgrade'
  | 'common.downgrade'
  | 'common.install'
  | 'common.uninstall'
  | 'common.remove'
  | 'common.add'
  | 'common.create'
  | 'common.read'
  | 'common.write'
  | 'common.modify'
  | 'common.confirm'
  | 'common.cancel'
  | 'common.continue'
  | 'common.skip'
  | 'common.finish'
  | 'common.start'
  | 'common.stop'
  | 'common.pause'
  | 'common.resume'
  | 'common.restart'
  | 'common.refresh'
  | 'common.reload'
  | 'common.sync'
  | 'common.upload'
  | 'common.download'
  | 'common.import'
  | 'common.export'
  | 'common.print'
  | 'common.save'
  | 'common.saveAs'
  | 'common.saveAll'
  | 'common.delete'
  | 'common.deleteAll'
  | 'common.archive'
  | 'common.unarchive'
  | 'common.favorite'
  | 'common.unfavorite'
  | 'common.like'
  | 'common.unlike'
  | 'common.follow'
  | 'common.unfollow'
  | 'common.block'
  | 'common.unblock'
  | 'common.mute'
  | 'common.unmute'
  | 'common.pin'
  | 'common.unpin'
  | 'common.flag'
  | 'common.unflag'
  | 'common.mark'
  | 'common.unmark'
  | 'common.select'
  | 'common.unselect'
  | 'common.selectAll'
  | 'common.unselectAll'
  | 'common.expand'
  | 'common.collapse'
  | 'common.zoomIn'
  | 'common.zoomOut'
  | 'common.resetZoom'
  | 'common.fullscreen'
  | 'common.exitFullscreen'
  | 'common.notifications'
  | 'common.messages'
  | 'common.alerts'
  | 'common.reminders'
  | 'common.calendar'
  | 'common.schedule'
  | 'common.events'
  | 'common.tasks'
  | 'common.projects'
  | 'common.groups'
  | 'common.teams'
  | 'common.members'
  | 'common.users'
  | 'common.roles'
  | 'common.permissions'
  | 'common.settings'
  | 'common.preferences'
  | 'common.options'
  | 'common.configuration'
  | 'common.setup'
  | 'common.install'
  | 'common.uninstall'
  | 'common.update'
  | 'common.upgrade'
  | 'common.downgrade'
  | 'common.version'
  | 'common.build'
  | 'common.release'
  | 'common.debug'
  | 'common.test'
  | 'common.production'
  | 'common.staging'
  | 'common.development'
  | 'common.local'
  | 'common.remote'
  | 'common.cloud'
  | 'common.offline'
  | 'common.online'
  | 'common.connected'
  | 'common.disconnected'
  | 'common.synced'
  | 'common.unsynced'
  | 'common.pending'
  | 'common.processing'
  | 'common.completed'
  | 'common.failed'
  | 'common.cancelled'
  | 'common.skipped'
  | 'common.ignored'
  | 'common.blocked'
  | 'common.allowed'
  | 'common.denied'
  | 'common.granted'
  | 'common.revoked'
  | 'common.expired'
  | 'common.renewed'
  | 'common.active'
  | 'common.inactive'
  | 'common.enabled'
  | 'common.disabled'
  | 'common.locked'
  | 'common.unlocked'
  | 'common.secured'
  | 'common.unsecured'
  | 'common.public'
  | 'common.private'
  | 'common.shared'
  | 'common.personal'
  | 'common.business'
  | 'common.enterprise'
  | 'common.free'
  | 'common.paid'
  | 'common.premium'
  | 'common.trial'
  | 'common.beta'
  | 'common.alpha'
  | 'common.stable'
  | 'common.unstable'
  | 'common.deprecated'
  | 'common.experimental'
  | 'common.custom'
  | 'common.default'
  | 'common.automatic'
  | 'common.manual'
  | 'common.other'
  | 'common.unknown'
  | 'common.undefined'
  | 'common.null'
  | 'common.empty'
  | 'common.full'
  | 'common.partial'
  | 'common.complete'
  | 'common.incomplete'
  | 'common.valid'
  | 'common.invalid'
  | 'common.error'
  | 'common.warning'
  | 'common.info'
  | 'common.success'
  | 'common.failure'
  | 'common.debug'
  | 'common.trace'
  | 'common.verbose'
  | 'common.silent'
  | 'common.quiet'
  | 'common.loud'
  | 'common.normal'
  | 'common.abnormal'
  | 'common.critical'
  | 'common.major'
  | 'common.minor'
  | 'common.trivial'
  | 'common.important'
  | 'common.urgent'
  | 'common.high'
  | 'common.medium'
  | 'common.low'
  | 'common.none'
  | 'common.all'
  | 'common.some'
  | 'common.few'
  | 'common.many'
  | 'common.most'
  | 'common.least'
  | 'common.first'
  | 'common.last'
  | 'common.next'
  | 'common.previous'
  | 'common.current'
  | 'common.old'
  | 'common.new'
  | 'common.latest'
  | 'common.earliest'
  | 'common.recent'
  | 'common.upcoming'
  | 'common.past'
  | 'common.future'
  | 'common.now'
  | 'common.never'
  | 'common.always'
  | 'common.sometimes'
  | 'common.often'
  | 'common.rarely'
  | 'common.usually'
  | 'common.occasionally'
  | 'common.frequently'
  | 'common.infrequently'
  | 'common.daily'
  | 'common.weekly'
  | 'common.monthly'
  | 'common.yearly'
  | 'common.hourly'
  | 'common.minutely'
  | 'common.secondly'
  | 'common.instantly'
  | 'common.immediately'
  | 'common.eventually'
  | 'common.soon'
  | 'common.later'
  | 'common.earlier'
  | 'common.today'
  | 'common.tomorrow'
  | 'common.yesterday'
  | 'common.morning'
  | 'common.afternoon'
  | 'common.evening'
  | 'common.night'
  | 'common.midnight'
  | 'common.noon'
  | 'common.dawn'
  | 'common.dusk'
  | 'common.sunrise'
  | 'common.sunset'

export interface UIStringsService {
  getLocale(): SupportedLanguage;
  setLocale(locale: SupportedLanguage): Promise<void>;
  getUIString(path: UIStringPath, params?: Record<string, any>): string;
}

export class UIStringsServiceImpl implements UIStringsService {
  private locale: SupportedLanguage = 'en';
  private strings: Record<string, string> = {};

  constructor() {
    // Load initial strings
    this.loadStrings('en');
  }

  getLocale(): SupportedLanguage {
    return this.locale;
  }

  async setLocale(locale: SupportedLanguage): Promise<void> {
    this.locale = locale;
    await this.loadStrings(locale);
  }

  getUIString(path: UIStringPath, params?: Record<string, any>): string {
    const value = this.strings[path] || path;
    if (!params) return value;

    return value.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key]?.toString() || `{${key}}`;
    });
  }

  private async loadStrings(locale: SupportedLanguage): Promise<void> {
    try {
      // In a real app, this would load strings from a file or API
      this.strings = await import(`./locales/${locale}.json`);
    } catch (error) {
      console.error(`Failed to load strings for locale ${locale}:`, error);
      // Fallback to English
      if (locale !== 'en') {
        await this.loadStrings('en');
      }
    }
  }
}

export const uiStringsService = new UIStringsServiceImpl();