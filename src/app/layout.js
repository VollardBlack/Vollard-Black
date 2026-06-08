import './globals.css';

export const metadata = {
  title: 'The Winelands Art Gallery — Art Backers Platform',
  description: 'Back South African artists. Display exceptional art. Share in the upside.',
  openGraph: {
    title: 'The Winelands Art Gallery — Art Backers Platform',
    description: 'Back South African artists. Display exceptional art. Share in the upside.',
    url: 'https://thewinelandsartgallery.com',
    siteName: 'The Winelands Art Gallery',
    images: [
      {
        url: 'https://thewinelandsartgallery.com/cdn/shop/files/1200_x_628_High.png?v=1751468064',
        width: 1800,
        height: 942,
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
