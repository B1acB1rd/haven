/**
 * Haven Browser - Ad Blocker Service
 * 
 * Built-in ad and tracker blocking using filter rules.
 * This runs in the Electron main process and intercepts requests.
 */

import { session } from 'electron';

// Ad/tracker blocking domains (subset of EasyList for performance)
const BLOCKED_DOMAINS = [
    // Ad networks
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'google-analytics.com',
    'googletagmanager.com',
    'googletagservices.com',
    'adservice.google.com',
    'pagead2.googlesyndication.com',
    'partner.googleadservices.com',
    'pubads.g.doubleclick.net',
    'securepubads.g.doubleclick.net',
    'tpc.googlesyndication.com',
    'www.googleadservices.com',
    'adnxs.com',
    'adsrvr.org',
    'adform.net',
    'advertising.com',
    'rubiconproject.com',
    'openx.net',
    'pubmatic.com',
    'criteo.com',
    'criteo.net',
    'outbrain.com',
    'taboola.com',
    'mgid.com',
    'revcontent.com',
    'popads.net',
    'exoclick.com',
    'adcolony.com',
    'unity3d.com/ads',
    'mopub.com',
    'vungle.com',
    'chartboost.com',
    'applovin.com',
    'ironsrc.com',
    'moatads.com',
    'adsafeprotected.com',
    'doubleverify.com',

    // Tracking
    'facebook.net',
    'facebook.com/tr',
    'connect.facebook.net',
    'pixel.facebook.com',
    'hotjar.com',
    'mouseflow.com',
    'crazyegg.com',
    'fullstory.com',
    'luckyorange.com',
    'clicktale.net',
    'inspectlet.com',
    'quantserve.com',
    'scorecardresearch.com',
    'imrworldwide.com',
    'mixpanel.com',
    'amplitude.com',
    'segment.io',
    'segment.com',
    'heapanalytics.com',
    'kissmetrics.com',

    // Social trackers
    'platform.twitter.com/widgets',
    'syndication.twitter.com',
    'platform.linkedin.com',
    'snap.licdn.com',
    'px.ads.linkedin.com',

    // Other trackers
    'mc.yandex.ru',
    'counter.yadro.ru',
    'top-fwz1.mail.ru',
    'ad.mail.ru',
    'omtrdc.net',
    'demdex.net',
    'everesttech.net',
];

// URL patterns to block (regex-like matching)
const BLOCKED_PATTERNS = [
    /\/ads\//i,
    /\/ad\//i,
    /\/advert/i,
    /\/banner/i,
    /\/sponsor/i,
    /\/tracking/i,
    /\/tracker/i,
    /\/analytics\.js/i,
    /\/gtag\/js/i,
    /\/gtm\.js/i,
    /\/pixel\.js/i,
    /\/beacon/i,
    /doubleclick/i,
    /googlesyndication/i,
    /facebook.*pixel/i,
    /fbevents\.js/i,
];

// Resource types to consider blocking
const BLOCKABLE_TYPES = [
    'script',
    'image',
    'stylesheet',
    'xhr',
    'fetch',
    'subFrame',
    'object',
    'ping',
];

interface BlockerStats {
    blocked: number;
    allowed: number;
    lastBlocked: string[];
}

class AdBlockerService {
    private enabled: boolean = true;
    private stats: Map<string, BlockerStats> = new Map();
    private registeredSessions: Set<string> = new Set();

    constructor() {
        // Load enabled state from storage (could be persisted)
        this.enabled = true;
    }

    /**
     * Check if a URL should be blocked
     */
    shouldBlock(url: string, resourceType?: string): boolean {
        if (!this.enabled) return false;

        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();
            const fullUrl = url.toLowerCase();

            // Check blocked domains
            for (const blockedDomain of BLOCKED_DOMAINS) {
                if (hostname === blockedDomain || hostname.endsWith('.' + blockedDomain)) {
                    return true;
                }
            }

            // Check blocked patterns
            for (const pattern of BLOCKED_PATTERNS) {
                if (pattern.test(fullUrl)) {
                    return true;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    /**
     * Register ad blocking for a session partition
     */
    registerSession(partitionName: string): void {
        if (this.registeredSessions.has(partitionName)) {
            return; // Already registered
        }

        const ses = session.fromPartition(partitionName);

        // Initialize stats for this partition
        this.stats.set(partitionName, {
            blocked: 0,
            allowed: 0,
            lastBlocked: [],
        });

        // Intercept requests
        ses.webRequest.onBeforeRequest(
            { urls: ['<all_urls>'] },
            (details, callback) => {
                const shouldBlock = this.shouldBlock(details.url, details.resourceType);

                if (shouldBlock) {
                    // Update stats
                    const stats = this.stats.get(partitionName);
                    if (stats) {
                        stats.blocked++;
                        stats.lastBlocked.unshift(details.url);
                        // Keep only last 10
                        if (stats.lastBlocked.length > 10) {
                            stats.lastBlocked.pop();
                        }
                    }

                    console.log(`[AdBlocker] Blocked: ${details.url.substring(0, 80)}...`);
                    callback({ cancel: true });
                } else {
                    const stats = this.stats.get(partitionName);
                    if (stats) stats.allowed++;
                    callback({});
                }
            }
        );

        this.registeredSessions.add(partitionName);
        console.log(`[AdBlocker] Registered for partition: ${partitionName}`);
    }

    /**
     * Enable/disable ad blocking
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Check if ad blocking is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get blocking stats for a partition
     */
    getStats(partitionName: string): BlockerStats | undefined {
        return this.stats.get(partitionName);
    }

    /**
     * Get total blocked count across all sessions
     */
    getTotalBlocked(): number {
        let total = 0;
        this.stats.forEach((stats) => {
            total += stats.blocked;
        });
        return total;
    }

    /**
     * Reset stats
     */
    resetStats(): void {
        this.stats.forEach((stats) => {
            stats.blocked = 0;
            stats.allowed = 0;
            stats.lastBlocked = [];
        });
    }
}

// Singleton instance
export const adBlocker = new AdBlockerService();
