import type { Href } from 'expo-router';
import { Linking, Platform } from 'react-native';

type RouterLike = {
    push: (href: Href) => void;
    replace: (href: Href) => void;
};

type NavigateOptions = {
    replace?: boolean;
};

export function resetWebScrollPosition() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
        return;
    }

    try {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    } catch {
        // Ignore history access issues during SSR or prerendering.
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function hardNavigate(href: string, router?: RouterLike, options?: NavigateOptions) {
    if (!href) {
        return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        resetWebScrollPosition();

        if (options?.replace) {
            window.location.replace(href);
            return;
        }

        window.location.assign(href);
        return;
    }

    if (!router) {
        return;
    }

    if (options?.replace) {
        router.replace(href as Href);
        return;
    }

    router.push(href as Href);
}

export async function openExternalUrl(url: string) {
    if (!url) {
        return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }

    await Linking.openURL(url);
}
