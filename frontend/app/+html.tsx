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
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Fix mobile viewport scaling — ensures the site renders at the correct mobile width */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0a2540" />
        {/*
          Disable body/html overflow clipping so ScrollView works correctly.
          @see https://github.com/expo/expo/blob/main/packages/expo-router/src/static/renderStaticContent.tsx
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: rootStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyles = `
  html, body, #root {
    height: 100%;
  }
  body {
    overflow: hidden;
  }
  #root {
    display: flex;
    flex: 1;
  }
`;
