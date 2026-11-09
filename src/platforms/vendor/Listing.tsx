import { motion } from 'framer-motion'
import { Camera, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Star, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge, Chip } from '../../components/Badge'
import { Money, Stars, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Input, TextArea, Toggle } from '../../components/Form'
import { HeroImage, Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { CLOCK } from '../../data/clock'
import { DEMO_LISTING, DEMO_PACKAGE } from '../../data/demoFill'
import { img } from '../../data/media'
import { CATEGORIES, vendorById, type CategoryId, type Package } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, SAFE_TOP, SectionHead, safeTop } from '../mobileShell'

/* vendor.listing: Bola edits her catering listing. The cover photo runs
   behind the status bar with the title typed over the scrim; the photo
   rail overlaps the hero's bottom edge; every field is pre-filled from
   DEMO_LISTING so the demo is tap-only. Save → session.editListing(). */

const V = vendorById('iyabola')
const TAG_POOL = ['Vegan options', 'Live grill station', 'Gluten-free', 'Dessert table']
const LANGS = ['English', 'Yorùbá', 'Pidgin', 'Igbo', 'Hausa']
const UNITS: Package['unit'][] = ['per head', 'flat', 'per hour', 'per day']

function ChipButton({ on, onClick, children, icon, label }: { on?: boolean; onClick: () => void; children: ReactNode; icon?: ReactNode; label?: string }) {
  return (
    <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={onClick} aria-pressed={on} aria-label={label} className="flex min-h-[44px] shrink-0 snap-start items-center">
      <Chip on={on} icon={icon}>
        {children}
      </Chip>
    </motion.button>
  )
}

export default function VendorListing() {
  const { navigate, back, canGoBack, toast } = useNav()
  const edited = useSession((s) => s.listingEdited)

  const [cover, setCover] = useState(0)
  const [title, setTitle] = useState(DEMO_LISTING.title)
  const [tagline, setTagline] = useState(DEMO_LISTING.tagline)
  const [price, setPrice] = useState(DEMO_LISTING.priceFrom)
  const [priceErr, setPriceErr] = useState<string | undefined>()
  const [minGuests, setMinGuests] = useState(DEMO_LISTING.minGuests)
  const [travel, setTravel] = useState(DEMO_LISTING.travel)
  const [about, setAbout] = useState(DEMO_LISTING.about)
  const [category, setCategory] = useState<CategoryId>('catering')
  const [tags, setTags] = useState<string[]>(V.tags)
  const [packages, setPackages] = useState<Package[]>(V.packages)
  const [langs, setLangs] = useState<string[]>(V.languages)
  const [preview, setPreview] = useState(false)

  /* package sheet: 'new' or the id being edited */
  const [editing, setEditing] = useState<'new' | string | null>(null)
  const [pkgName, setPkgName] = useState(DEMO_PACKAGE.name)
  const [pkgPrice, setPkgPrice] = useState(DEMO_PACKAGE.price)
  const [pkgUnit, setPkgUnit] = useState<Package['unit']>('per head')
  const [pkgIncludes, setPkgIncludes] = useState(DEMO_PACKAGE.includes)

  const openPackage = (p: Package | 'new') => {
    if (p === 'new') {
      setPkgName(DEMO_PACKAGE.name)
      setPkgPrice(DEMO_PACKAGE.price)
      setPkgUnit('per head')
      setPkgIncludes(DEMO_PACKAGE.includes)
      setEditing('new')
    } else {
      setPkgName(p.name)
      setPkgPrice(String(p.price))
      setPkgUnit(p.unit)
      setPkgIncludes(p.includes)
      setEditing(p.id)
    }
  }
  const savePackage = () => {
    const priceN = Number(pkgPrice) || Number(DEMO_PACKAGE.price)
    if (editing === 'new') {
      setPackages((ps) => [...ps, { id: `pkg-${Date.now()}`, name: pkgName || DEMO_PACKAGE.name, price: priceN, unit: pkgUnit, includes: pkgIncludes }])
      track('package_added', pkgName)
      toast(`Package added · ${pkgName || DEMO_PACKAGE.name}`, 'accent')
    } else {
      setPackages((ps) => ps.map((p) => (p.id === editing ? { ...p, name: pkgName, price: priceN, unit: pkgUnit, includes: pkgIncludes } : p)))
      toast('Package updated', 'accent')
    }
    setEditing(null)
  }

  const save = () => {
    if (!price.trim() || Number.isNaN(Number(price))) {
      setPriceErr('Enter a whole number, e.g. 32')
      toast('Fix the price before saving', 'warn')
      return
    }
    session.editListing()
    track('listing_saved', title)
    toast('Listing updated · live in search', 'accent')
  }

  const addTag = () => {
    const next = TAG_POOL.find((t) => !tags.includes(t))
    if (!next) return toast('All suggested tags are on the listing')
    setTags((ts) => [...ts, next])
    toast(`Added “${next}”`, 'accent')
  }
  const removeTag = (t: string) => {
    setTags((ts) => ts.filter((x) => x !== t))
    toast(`Removed “${t}”`)
  }

  const priceN = Number(price) || V.priceFrom

  return (
    <MobileScreen
      cap="var(--night)"
      overlay={
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3" style={{ paddingTop: safeTop(6) }}>
          <IconButton className="pointer-events-auto" icon={ChevronLeft} label="Back" tone="scrim" onClick={() => (canGoBack ? back() : navigate('vendor.listings'))} />
          <IconButton className="pointer-events-auto" icon={Eye} label="Preview as a client" tone="scrim" onClick={() => setPreview(true)} />
        </div>
      }
      dock={
        <Dock>
          <Button variant="outline" size="lg" icon={Eye} onClick={() => setPreview(true)} aria-label="Preview as a client">
            Preview
          </Button>
          <Button block size="lg" onClick={save}>
            Save changes
          </Button>
        </Dock>
      }
    >
      {/* Cover photo hero, behind the status bar */}
      <HeroImage src={V.photos[cover]} alt="" className="h-[300px]" scrim="both" position="center 40%">
        <div className="flex h-full flex-col justify-end px-5 pb-11" style={{ paddingTop: SAFE_TOP }}>
          <div className="flex items-center gap-2">
            <Badge tone="success">Live in search</Badge>
            {edited && <span className="meta text-on-ink-2">Saved {CLOCK.time}</span>}
          </div>
          <p className="label mt-3 text-brass-light">Editing · catering listing</p>
          <h1 className="grot mt-1 text-[34px] text-on-ink">{title || V.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-on-ink-2">
            <Verified tone="light" />
            <Stars rating={V.rating} count={V.reviews} tone="ink" />
            <span>{V.years} years</span>
            <span>{V.bookings} bookings</span>
          </div>
        </div>
      </HeroImage>

      {/* Photo rail, overlapping the hero's bottom edge */}
      <div className="relative z-10 -mt-7">
        <Rail gap={10}>
          {V.photos.map((p, i) => (
            <motion.button
              key={p}
              type="button"
              whileTap={tap}
              transition={spring.ui}
              aria-label={i === cover ? 'Cover photo' : `Make photo ${i + 1} the cover`}
              onClick={() => {
                if (i === cover) return toast('This is already the cover photo')
                setCover(i)
                toast('Cover photo updated', 'accent')
              }}
              className="relative shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] ring-4 ring-[var(--bg)]"
              style={{ width: i === 0 ? 150 : 104, height: 104 }}
            >
              <img src={img(p, 400)} alt="" className="h-full w-full object-cover" />
              {i === cover && <span className="label absolute left-2 top-2 rounded-full bg-brass px-2 py-1 text-on-brass">Cover</span>}
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileTap={tap}
            transition={spring.ui}
            onClick={() => toast('Photo picker opens here · up to 12 photos per listing')}
            className="grid h-[104px] w-[104px] shrink-0 snap-start place-content-center justify-items-center gap-1 rounded-[var(--r-card)] border-2 border-dashed border-[var(--rule-strong)] bg-[var(--surface)] text-text-2 ring-4 ring-[var(--bg)]"
          >
            <Camera size={20} strokeWidth={2.2} aria-hidden />
            <span className="text-[12px] font-bold">+ Add photo</span>
          </motion.button>
        </Rail>
        <p className="meta mt-2 px-5 text-text-2">
          {V.photos.length} of 12 photos · tap one to make it the cover
        </p>
      </div>

      {/* Basics */}
      <SectionHead className="mt-7" eyebrow="Basics" title="What clients see first" />
      <div className="mt-4 flex flex-col gap-4 px-5">
        <Input label="Listing title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} hint="One line under your name in search results" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price from"
            inputMode="numeric"
            value={price}
            error={priceErr}
            onChange={(e) => {
              setPrice(e.target.value)
              if (priceErr && e.target.value.trim() && !Number.isNaN(Number(e.target.value))) setPriceErr(undefined)
            }}
            leading={<span className="text-[15px] font-bold text-text">£</span>}
            trailing={<span className="text-[11px] font-bold">per head</span>}
          />
          <Input label="Minimum guests" inputMode="numeric" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} trailing={<span className="text-[11px] font-bold">guests</span>} />
        </div>
        <Input label="Service area" value={travel} onChange={(e) => setTravel(e.target.value)} />
        <TextArea label="About" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} hint={`${about.length} / 400 · shown on your public listing`} />
      </div>

      {/* Category */}
      <div className="mt-7">
        <SectionHead eyebrow="Category" title={<>Listed as <em>{CATEGORIES.find((c) => c.id === category)?.label.toLowerCase()}</em></>} />
        <Rail className="mt-3" gap={8}>
          {CATEGORIES.filter((c) => c.id !== 'planner').map((c) => (
            <ChipButton
              key={c.id}
              on={category === c.id}
              onClick={() => {
                setCategory(c.id)
                toast(category === c.id ? `Already listed under ${c.label}` : `Category set to ${c.label} · saves with the listing`)
              }}
            >
              {c.label}
            </ChipButton>
          ))}
        </Rail>
      </div>

      {/* Tags */}
      <div className="mt-6 px-5">
        <div className="flex items-end justify-between">
          <p className="label text-text-2">Tags</p>
          <span className="meta text-text-2">{tags.length} of 8</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <motion.button key={t} type="button" whileTap={tap} transition={spring.ui} onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="flex min-h-[40px] items-center">
              <Chip icon={<X size={13} strokeWidth={2.6} aria-hidden className="order-last -mr-1 text-text-2" />}>{t}</Chip>
            </motion.button>
          ))}
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={addTag} className="flex min-h-[40px] items-center">
            <span className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-dashed border-[var(--rule-strong)] px-3 text-[13px] font-bold text-accent-ink">
              <Plus size={14} strokeWidth={2.6} aria-hidden /> Add tag
            </span>
          </motion.button>
        </div>
      </div>

      {/* Packages: editable rows */}
      <SectionHead className="mt-8" eyebrow={`${packages.length} packages`} title="Packages" action="Add package" onAction={() => openPackage('new')} />
      <ul className="mt-3 divide-y divide-[var(--rule)] border-y border-[var(--rule)] bg-[var(--surface)]">
        {packages.map((p) => (
          <li key={p.id} className="flex items-start gap-3 py-4 pl-5 pr-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-bold">{p.name}</p>
                {p.popular && (
                  <Badge tone="accent" icon={<Star size={11} fill="currentColor" strokeWidth={0} aria-hidden />}>
                    Popular
                  </Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-text-2">{p.includes}</p>
              <div className="mt-3 flex items-center gap-2.5">
                <Toggle on={!!p.popular} label={`Show ${p.name} as Popular`} onChange={(on) => setPackages((ps) => ps.map((x) => (x.id === p.id ? { ...x, popular: on } : x)))} />
                <span className="text-[12px] font-semibold text-text-2">Show as Popular</span>
              </div>
            </div>
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => openPackage(p)} aria-label={`Edit ${p.name}`} className="flex min-h-[44px] min-w-[92px] flex-col items-end whitespace-nowrap rounded-[var(--r-control)] px-2 py-1 text-right">
              <Money amount={p.price} size={22} />
              <span className="meta text-text-2">{p.unit}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-accent-ink">
                <Pencil size={12} strokeWidth={2.4} aria-hidden /> Edit
              </span>
            </motion.button>
          </li>
        ))}
      </ul>

      {/* Availability band: the strip, pulled from Calendar */}
      <Pressable onClick={() => navigate('vendor.calendar')} className="relative mx-5 mt-7 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span aria-hidden className="arc-soft" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="label text-brass-light">Availability · next 14 days</p>
            <p className="mt-1 text-[15px] font-bold">Shown on this listing from your calendar</p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-on-ink-2" aria-hidden />
        </div>
        <Strip vendor={V} size="md" labels tone="ink" className="relative mt-4" />
        <div className="relative mt-3 flex items-center justify-between">
          <StripLegend tone="ink" />
          <span className="meta text-on-ink-2">Tonight booked · 1 held</span>
        </div>
      </Pressable>

      {/* Languages */}
      <div className="mt-7 px-5">
        <p className="label text-text-2">Languages spoken</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <ChipButton
              key={l}
              on={langs.includes(l)}
              onClick={() => {
                const on = langs.includes(l)
                if (on && langs.length === 1) return toast('Keep at least one language', 'warn')
                setLangs((ls) => (on ? ls.filter((x) => x !== l) : [...ls, l]))
              }}
            >
              {l}
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Reviews link */}
      <Pressable onClick={() => navigate('vendor.reviews')} className="mx-5 mt-6 flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brass-soft text-on-brass-soft">
          <Star size={20} fill="currentColor" strokeWidth={0} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">
            {V.reviews} reviews · {V.rating.toFixed(1)}
          </p>
          <p className="text-[13px] text-text-2">1 review needs a reply · shown on this listing</p>
        </div>
        <ChevronRight size={20} className="text-text-2" aria-hidden />
      </Pressable>
      <p className="meta mt-4 px-5 text-text-2">Changes go live in search as soon as you save. Prices are quotes; payments arrive in a later phase.</p>

      {/* Package sheet */}
      <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add package' : 'Edit package'} tall>
        <div className="flex flex-col gap-4 pt-1">
          <Input label="Package name" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <Input label="Price" inputMode="numeric" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} leading={<span className="text-[15px] font-bold text-text">£</span>} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">Unit</span>
              <div className="flex gap-1.5">
                {UNITS.map((u) => (
                  <ChipButton key={u} on={pkgUnit === u} onClick={() => setPkgUnit(u)}>
                    {u}
                  </ChipButton>
                ))}
              </div>
            </div>
          </div>
          <TextArea label="What it includes" rows={3} value={pkgIncludes} onChange={(e) => setPkgIncludes(e.target.value)} hint="Separate items with a dot" />
          <div className="rounded-[var(--r-card)] bg-[var(--surface-high)] p-4">
            <p className="label text-text-2">Preview</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold">{pkgName || DEMO_PACKAGE.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-text-2">{pkgIncludes}</p>
              </div>
              <div className="text-right">
                <Money amount={Number(pkgPrice) || 0} size={22} />
                <p className="meta text-text-2">{pkgUnit}</p>
              </div>
            </div>
          </div>
          <Button block size="lg" onClick={savePackage}>
            {editing === 'new' ? 'Add' : 'Save package'}
          </Button>
        </div>
      </BottomSheet>

      {/* Preview as a client */}
      <BottomSheet open={preview} onClose={() => setPreview(false)} title="Preview as a client" tall>
        <p className="text-[13px] text-text-2">How this listing appears in Explore and search results.</p>
        <div className="mt-4 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
          <HeroImage src={V.photos[cover]} alt="" className="h-[170px]" scrim="b">
            <div className="flex h-full flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <Badge tone="ink">{CATEGORIES.find((c) => c.id === category)?.label}</Badge>
                <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[12px] font-bold text-text">
                  from <Money amount={priceN} size={14} /> per head
                </span>
              </div>
            </div>
          </HeroImage>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <p className="grot text-[22px]">{title || V.name}</p>
              <Verified />
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] text-text-2">{tagline}</p>
            <div className="mt-2 flex items-center gap-3 text-[13px]">
              <Stars rating={V.rating} count={V.reviews} />
              <span className="text-text-2">
                {V.years} years · {V.area}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="label text-text-2">Next 14 days</span>
              <StripLegend />
            </div>
            <Strip vendor={V} size="xs" className="mt-1.5" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
              {tags.length > 4 && <Chip>+{tags.length - 4} more</Chip>}
            </div>
          </div>
        </div>
        <Button
          block
          size="lg"
          className="mt-4"
          onClick={() => {
            setPreview(false)
            save()
          }}
        >
          Looks good · Save changes
        </Button>
      </BottomSheet>
    </MobileScreen>
  )
}
