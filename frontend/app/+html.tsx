import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * Custom HTML template for the Expo web build.
 * This file is only used during static/web rendering.
 * The viewport meta tag here ensures correct mobile scaling —
 * without user-scalable=no to preserve accessibility, but
 * with explicit width=device-width to prevent the layout
 * from rendering at a desktop viewport width on mobile browsers.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>CYVHUB | Smart Logistics & Delivery Infrastructure</title>
        <meta name="description" content="CYVHUB provides a powerful infrastructure for carriers, drivers, and businesses to manage logistics with real-time tracking, automated dispatch, and AI-driven efficiency." />
        <meta name="keywords" content="logistics, delivery, courier, freight, AI logistics, tracking, carrier management" />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cyvhub.com/" />
        <meta property="og:title" content="CYVHUB | Smart Logistics Infrastructure" />
        <meta property="og:description" content="Manage your entire logistics operation from a single, powerful platform." />
        <meta property="og:image" content="https://cyvhub.com/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://cyvhub.com/" />
        <meta property="twitter:title" content="CYVHUB | Smart Logistics Infrastructure" />
        <meta property="twitter:description" content="Manage your entire logistics operation from a single, powerful platform." />
        <meta property="twitter:image" content="https://cyvhub.com/og-image.jpg" />

        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: scrollResetScript }} />
        <style dangerouslySetInnerHTML={{ __html: rootStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const scrollResetScript = `
  (() => {
    const resetScroll = () => {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
      } catch {}
    };

    resetScroll();
    window.addEventListener('load', resetScroll, { once: true });
    window.addEventListener('pageshow', resetScroll);
  })();
`;

const rootStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    max-width: 100vw;
  }
  
  body {
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  #root {
    display: flex;
    flex: 1;
  }
`;
