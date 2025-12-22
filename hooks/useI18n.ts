'use client'

import { useEffect, useState, useMemo } from 'react'

import { useLocalization } from '@/hooks/useLocalization'
import { getDictionary } from '@/lib/i18n/dict'
import { t as translate } from '@/lib/i18n/translate'

import type { Lang, Messages } from '@/types/i18n'

export function useI18n() {
  const { language } = useLocalization()
  const [dict, setDict] = useState<Messages | null>(null)

  useEffect(() => {
    let mounted = true
    getDictionary(language as Lang)
      .then((d) => { if (mounted) {setDict(d)} })
      .catch(() => { if (mounted) {setDict(null)} })
    return () => { mounted = false }
  }, [language])

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) =>
      dict ? translate(dict, key, params) : key
  }, [dict])

  return { t, dict, language }
}
