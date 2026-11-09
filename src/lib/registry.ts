import type { ComponentType } from 'react'
import type { ScreenId } from './navigation'

import AppWelcome from '../platforms/app/Welcome'
import AppSignin from '../platforms/app/Signin'
import AppOtp from '../platforms/app/Otp'
import AppHome from '../platforms/app/Home'
import AppEvent from '../platforms/app/Event'
import AppPlanner from '../platforms/app/Planner'
import AppExplore from '../platforms/app/Explore'
import AppVendor from '../platforms/app/Vendor'
import AppBooking from '../platforms/app/Booking'
import AppBookings from '../platforms/app/Bookings'
import AppGuests from '../platforms/app/Guests'
import AppInvite from '../platforms/app/Invite'
import AppMessages from '../platforms/app/Messages'
import AppThread from '../platforms/app/Thread'
import AppNotifications from '../platforms/app/Notifications'
import AppProfile from '../platforms/app/Profile'
import ProSignin from '../platforms/pro/Signin'
import ProHome from '../platforms/pro/Home'
import ProEvents from '../platforms/pro/Events'
import ProEvent from '../platforms/pro/Event'
import ProCalendar from '../platforms/pro/Calendar'
import ProVendors from '../platforms/pro/Vendors'
import ProRequests from '../platforms/pro/Requests'
import ProGuests from '../platforms/pro/Guests'
import ProCheckin from '../platforms/pro/Checkin'
import ProVerification from '../platforms/pro/Verification'
import ProMessages from '../platforms/pro/Messages'
import ProProfile from '../platforms/pro/Profile'
import VendorSignin from '../platforms/vendor/Signin'
import VendorHome from '../platforms/vendor/Home'
import VendorRequests from '../platforms/vendor/Requests'
import VendorRequest from '../platforms/vendor/Request'
import VendorCalendar from '../platforms/vendor/Calendar'
import VendorListings from '../platforms/vendor/Listings'
import VendorListing from '../platforms/vendor/Listing'
import VendorBookings from '../platforms/vendor/Bookings'
import VendorReviews from '../platforms/vendor/Reviews'
import VendorVerification from '../platforms/vendor/Verification'
import VendorProfile from '../platforms/vendor/Profile'
import AdminSignin from '../platforms/admin/Signin'
import AdminOverview from '../platforms/admin/Overview'
import AdminVerification from '../platforms/admin/Verification'
import AdminUsers from '../platforms/admin/Users'
import AdminMarketplace from '../platforms/admin/Marketplace'
import AdminBookings from '../platforms/admin/Bookings'
import AdminReviews from '../platforms/admin/Reviews'
import AdminNotifications from '../platforms/admin/Notifications'
import AdminReports from '../platforms/admin/Reports'
import AdminSettings from '../platforms/admin/Settings'

export type ScreenDef = {
  component: ComponentType
  /** status-bar glyph colour over the top of this screen */
  statusTone?: 'dark' | 'light'
  /** URL path shown in the browser frame */
  path?: string
}

/* Exhaustive by type: an unregistered ScreenId fails the build. */
export const SCREENS: Record<ScreenId, ScreenDef> = {
  'app.welcome': { component: AppWelcome, statusTone: 'light' },
  'app.signin': { component: AppSignin, statusTone: 'dark' },
  'app.otp': { component: AppOtp, statusTone: 'dark' },
  'app.home': { component: AppHome, statusTone: 'light' },
  'app.event': { component: AppEvent, statusTone: 'light' },
  'app.planner': { component: AppPlanner, statusTone: 'dark' },
  'app.explore': { component: AppExplore, statusTone: 'dark' },
  'app.vendor': { component: AppVendor, statusTone: 'light' },
  'app.booking': { component: AppBooking, statusTone: 'dark' },
  'app.bookings': { component: AppBookings, statusTone: 'dark' },
  'app.guests': { component: AppGuests, statusTone: 'dark' },
  'app.invite': { component: AppInvite, statusTone: 'light' },
  'app.messages': { component: AppMessages, statusTone: 'dark' },
  'app.thread': { component: AppThread, statusTone: 'dark' },
  'app.notifications': { component: AppNotifications, statusTone: 'dark' },
  'app.profile': { component: AppProfile, statusTone: 'dark' },
  'pro.signin': { component: ProSignin, statusTone: 'light' },
  'pro.home': { component: ProHome, statusTone: 'light' },
  'pro.events': { component: ProEvents, statusTone: 'dark' },
  'pro.event': { component: ProEvent, statusTone: 'light' },
  'pro.calendar': { component: ProCalendar, statusTone: 'dark' },
  'pro.vendors': { component: ProVendors, statusTone: 'dark' },
  'pro.requests': { component: ProRequests, statusTone: 'dark' },
  'pro.guests': { component: ProGuests, statusTone: 'dark' },
  'pro.checkin': { component: ProCheckin, statusTone: 'light' },
  'pro.verification': { component: ProVerification, statusTone: 'dark' },
  'pro.messages': { component: ProMessages, statusTone: 'dark' },
  'pro.profile': { component: ProProfile, statusTone: 'light' },
  'vendor.signin': { component: VendorSignin, statusTone: 'light' },
  'vendor.home': { component: VendorHome, statusTone: 'light' },
  'vendor.requests': { component: VendorRequests, statusTone: 'dark' },
  'vendor.request': { component: VendorRequest, statusTone: 'light' },
  'vendor.calendar': { component: VendorCalendar, statusTone: 'dark' },
  'vendor.listings': { component: VendorListings, statusTone: 'dark' },
  'vendor.listing': { component: VendorListing, statusTone: 'light' },
  'vendor.bookings': { component: VendorBookings, statusTone: 'dark' },
  'vendor.reviews': { component: VendorReviews, statusTone: 'dark' },
  'vendor.verification': { component: VendorVerification, statusTone: 'dark' },
  'vendor.profile': { component: VendorProfile, statusTone: 'light' },
  'admin.signin': { component: AdminSignin, path: '/sign-in' },
  'admin.overview': { component: AdminOverview, path: '/' },
  'admin.verification': { component: AdminVerification, path: '/verification?state=pending' },
  'admin.users': { component: AdminUsers, path: '/users' },
  'admin.marketplace': { component: AdminMarketplace, path: '/marketplace/listings' },
  'admin.bookings': { component: AdminBookings, path: '/events' },
  'admin.reviews': { component: AdminReviews, path: '/trust/reviews' },
  'admin.notifications': { component: AdminNotifications, path: '/notifications' },
  'admin.reports': { component: AdminReports, path: '/reports/90d' },
  'admin.settings': { component: AdminSettings, path: '/settings' },
}
