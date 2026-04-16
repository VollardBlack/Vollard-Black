import './globals.css';

export const metadata = {
  title: 'Vollard Black',
  description: 'Fine Art Acquisitions Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
