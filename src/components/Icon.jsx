/**
 * Line icons drawn on a 24×24 grid with a consistent 1.75 stroke.
 *
 * These replace the emoji that were previously used as UI icons. Emoji render
 * differently on every platform, can't inherit text colour, and are the single
 * most recognisable tell of an interface that wasn't designed by hand.
 */

const PATHS = {
  // Navigation
  home:     'M3 10.2 12 3.5l9 6.7V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z',
  dumbbell: 'M4 9.5v5M7.5 6.5v11M16.5 6.5v11M20 9.5v5M7.5 12h9',
  trending: 'm3 16.5 5.5-5.5 3.5 3.5L20.5 6M20.5 6h-5M20.5 6v5',
  notebook: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9.5 3v18M12.5 8.5h3.5M12.5 12.5h3.5',
  book:     'M5 4.8A1.8 1.8 0 0 1 6.8 3H19v14.5H6.8A1.8 1.8 0 0 0 5 19.3zM5 4.8v14.5A1.8 1.8 0 0 0 6.8 21H19',

  // Actions
  settings: 'M4 8h7.5M15.5 8H20M4 16h4.5M12.5 16H20M13.5 5.5v5M10.5 13.5v5',
  swap:     'M7.5 5 4.5 8l3 3M4.5 8h13M16.5 19l3-3-3-3M19.5 16h-13',
  undo:     'M4.5 9.5h10a5 5 0 0 1 0 10h-1.5M4.5 9.5l3.5-3.5M4.5 9.5 8 13',
  trash:    'M4.5 6.5h15M9.5 6.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M6.5 6.5l.9 13.1a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-13.1M10 10.5v6M14 10.5v6',
  plus:     'M12 5.5v13M5.5 12h13',
  check:    'm5.5 12.5 4.5 4.5 8.5-10',
  chevron:  'm6.5 9.5 5.5 5.5 5.5-5.5',
  arrow:    'M5 12h13M13 6.5l5.5 5.5-5.5 5.5',
  close:    'm6.5 6.5 11 11M17.5 6.5l-11 11',

  // Metrics
  flame:    'M12 2.8s3.7 3.6 3.7 7.4a3.7 3.7 0 0 1-7.4 0c0-1 .4-2 .4-2S6 10.5 6 14a6 6 0 0 0 12 0c0-5.7-6-11.2-6-11.2z',
  egg:      'M12 3.2c3.3 0 6 4.6 6 9.1a6 6 0 0 1-12 0c0-4.5 2.7-9.1 6-9.1z',
  steps:    'M5 19.5h4v-6.2a2 2 0 1 0-4 0zM15 15.5h4V9.3a2 2 0 1 0-4 0zM5 19.5v1.2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1.2M15 15.5v1.2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1.2',
  scale:    'M12 4.2v16M8 20.2h8M6.5 7.2h11M6.5 7.2 4 14.2h5zM17.5 7.2 15 14.2h5',
  droplet:  'M12 3.2s5.6 5.9 5.6 9.6a5.6 5.6 0 0 1-11.2 0C6.4 9.1 12 3.2 12 3.2z',
  moon:     'M20.2 14.8A8.2 8.2 0 0 1 9.2 3.8a8.2 8.2 0 1 0 11 11z',
  sun:      'M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8zM12 2.6v2M12 19.4v2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M2.6 12h2M19.4 12h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4',
  monitor:  'M4.5 5h15a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 20.5h6M12 16.5v4',
  trophy:   'M8 4h8v4.8a4 4 0 0 1-8 0zM8 5.8H5.6A1.6 1.6 0 0 0 4 7.4c0 2.1 2 3.7 4 3.7M16 5.8h2.4A1.6 1.6 0 0 1 20 7.4c0 2.1-2 3.7-4 3.7M12 12.8v3.4M9 20.2h6M9.5 16.2h5v4h-5z',
  timer:    'M12 8.5v4.2l2.6 1.6M12 4.5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.5 2.5h5',
  leaf:     'M5 19s-.5-6 3-9.5S18 5 19.5 4.5c.3 3-1 9.5-5 12S6.5 19.5 5 19zM8.5 15.5 5 19',
}

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.75, ...rest }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={`M${seg}`} />
      ))}
    </svg>
  )
}
