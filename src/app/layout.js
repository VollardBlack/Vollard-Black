import './globals.css';

export const metadata = {
  title: 'Vollard Black — Fine Art Acquisitions',
  description: 'Art acquisition and sales platform by Vollard Black',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
