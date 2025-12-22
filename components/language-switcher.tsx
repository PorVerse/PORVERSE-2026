// components/language-switcher.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { locales, localeNames, localeFlags, Locale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    // Replace locale in pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-black/50 px-4 py-2 text-white transition-colors hover:border-purple-500/50"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">
          {localeFlags[currentLocale]} {localeNames[currentLocale]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-purple-500/30 bg-black/95 backdrop-blur-md"
            >
              <div className="p-2">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => handleLocaleChange(locale)}
                    className={`
                      flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors
                      ${locale === currentLocale
                        ? 'bg-purple-500/20 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <span className="text-xl">{localeFlags[locale]}</span>
                    <span className="text-sm">{localeNames[locale]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}