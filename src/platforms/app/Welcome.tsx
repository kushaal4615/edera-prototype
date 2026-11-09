import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Figure, Wordmark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { HeroImage } from '../../components/Media'
import { CATEGORIES } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { LANG_LABEL, session, useLang, type Lang } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, safeBottom, safeTop } from '../mobileShell'

/* app.welcome: the entry screen. A full-bleed photograph runs behind the
   status bar; the language picker is the first thing a visitor can tap
   (Dave: "people should relate to it in their traditional language"). */

const LANGS: Lang[] = ['en', 'yo', 'pcm', 'ig', 'ha']
const FALLBACK: Partial<Record<Lang, string>> = {
  ig: 'Igbo arrives with the build; showing English for now',
  ha: 'Hausa arrives with the build; showing English for now',
}
/* marketplace counts (demo values): planners and venues from the category index, vendors across every other category */
const COUNT_PLANNERS = CATEGORIES.find((c) => c.id === 'planner')?.count ?? 142
const COUNT_VENUES = CATEGORIES.find((c) => c.id === 'venue')?.count ?? 184
const COUNT_VENDORS = 1440

export default function AppWelcome() {
  const { navigate, toast } = useNav()
  const { t, lang } = useLang()

  const pick = (l: Lang) => {
    session.setLang(l)
    track('language_pick', l)
    const note = FALLBACK[l]
    if (note) toast(note, 'info')
  }

  return (
    <MobileScreen
      padBottom={false}
      bg="var(--night)"
      dock={
        <Dock tone="clear">
          <div className="flex w-full flex-col gap-1.5">
            <Button
              size="lg"
              block
              trailing={ArrowRight}
              onClick={() => {
                track('get_started')
                navigate('app.signin')
              }}
            >
              {t('Get started', 'Bẹ̀rẹ̀', 'Make we start')}
            </Button>
            <Button variant="ghost" block style={{ color: 'var(--on-night)' }} onClick={() => toast('Planners and vendors use the Planner and Vendor apps: switch platform at the top', 'info')}>
              {t("I'm a planner or vendor", 'Olùṣètò tàbí olùpèsè ni mí', 'I be planner or vendor')}
            </Button>
          </div>
        </Dock>
      }
      dockHeight={140}
    >
      <div className="relative h-full min-h-[640px] w-full">
        {/* photograph, running behind the status bar */}
        <div className="absolute inset-0">
          <HeroImage src="weddingBalloons" alt="A couple under a cloud of balloons, guests behind them" className="h-full w-full" scrim="both" width={1200} position="center 35%" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="arc" style={{ bottom: '-30%', right: '-26%', width: '92%', opacity: 0.8 }} />
        </div>

        <div className="relative flex h-full flex-col" style={{ paddingTop: safeTop(14), paddingBottom: safeBottom(150) }}>
          {/* top row: wordmark + demo pill */}
          <div className="flex items-center justify-between px-5">
            <Wordmark size={24} tone="light" />
            <span className="label inline-flex h-7 items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.14)] px-2.5 text-on-night ring-1 ring-inset ring-[rgb(255_255_255/0.3)]">
              <Sparkles size={12} strokeWidth={2.4} aria-hidden />
              Free demo
            </span>
          </div>

          <div className="flex-1" />

          {/* language picker */}
          <div className="px-5">
            <p className="label mb-2 text-brass-light">{t('Choose your language', 'Yan èdè rẹ', 'Pick your language')}</p>
          </div>
          <div className="scroll-x flex gap-2 px-5" role="radiogroup" aria-label="Language">
            {LANGS.map((l) => {
              const on = l === lang
              return (
                <motion.button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  whileTap={tap}
                  transition={spring.ui}
                  onClick={() => pick(l)}
                  className={`h-10 shrink-0 snap-start rounded-full px-4 text-[13px] font-bold transition-colors duration-150 ${on ? 'bg-[var(--surface)] text-text' : 'bg-[rgb(255_255_255/0.1)] text-on-night ring-1 ring-inset ring-[rgb(255_255_255/0.38)]'}`}
                >
                  {l === 'ig' ? 'Igbo' : LANG_LABEL[l].native}
                </motion.button>
              )
            })}
          </div>

          {/* headline */}
          <div className="mt-6 px-5">
            <h1 className="grot text-[44px] leading-[0.98] text-on-night">
              {t('The one place for ', 'Ibi kan ṣoṣo fún ', 'Di one place for ')}
              <em>{t('your', 'ayẹyẹ', 'your')}</em>
              {t(' event', ' rẹ', ' event')}
            </h1>
            <p className="mt-3 max-w-[32ch] text-[15px] font-semibold leading-snug text-on-night-2">
              {t(
                'Planners, vendors and venues. See who is free before you message anyone.',
                'Àwọn olùṣètò, olùpèsè àti gbọ̀ngàn. Wo ẹni tó wà ní òfo kí o tó kọ sí ẹnikẹ́ni.',
                'Planners, vendors and venues. See who free before you message anybody.',
              )}
            </p>
          </div>

          {/* three figures over the photo */}
          <div className="mx-5 mt-6 grid grid-cols-3 divide-x divide-[rgb(255_255_255/0.22)] rounded-[var(--r-card)] bg-[rgb(11_38_34/0.45)] py-3 backdrop-blur-md">
            {[
              { n: COUNT_PLANNERS, label: t('planners', 'olùṣètò', 'planners') },
              { n: COUNT_VENDORS, label: t('vendors', 'olùpèsè', 'vendors') },
              { n: COUNT_VENUES, label: t('venues', 'gbọ̀ngàn', 'venues') },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center px-2">
                <Figure value={f.n.toLocaleString('en-GB')} size={28} tone="var(--on-night)" />
                <span className="label mt-1 text-on-night-2">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileScreen>
  )
}
