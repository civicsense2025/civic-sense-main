'use client';

import { useUIStrings } from '../hooks/useUIStrings';

export default function HomePage() {
  const { t } = useUIStrings();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{t('home.welcomeBack')}</h1>
      <p className="text-xl text-gray-600 mb-8">{t('home.loadingYourCivicJourney')}</p>
      <p className="text-lg">{t('home.dailyChallenge')}</p>
    </main>
  );
} 