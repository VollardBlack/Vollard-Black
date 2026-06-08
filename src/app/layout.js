import './globals.css';

export const metadata = {
  title: 'The Winelands Art Gallery — Art Backers Platform',
  description: 'Back South African artists. Display exceptional art. Share in the proceeds when it sells.',
  openGraph: {
    title: 'The Winelands Art Gallery — Art Backers Platform',
    description: 'Back South African artists. Display exceptional art. Share in the proceeds when it sells.',
    url: 'https://thewinelandsartgallery.com',
    siteName: 'The Winelands Art Gallery',
    locale: 'en_ZA',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
