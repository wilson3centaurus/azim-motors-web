import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hazim Motors',
    short_name: 'Hazim',
    description: 'Mobile-ready workshop, inventory, and job card operations for Hazim Motors.',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#081311',
    theme_color: '#1f5f59',
    categories: ['business', 'productivity', 'utilities'],
    lang: 'en',
    icons: [
      {
        src: '/pwa-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/maskable-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-wide.svg',
        sizes: '1280x720',
        type: 'image/svg+xml',
        form_factor: 'wide',
      },
      {
        src: '/screenshot-narrow.svg',
        sizes: '540x720',
        type: 'image/svg+xml',
        form_factor: 'narrow',
      },
    ],
  }
}