import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',        icon: '🏠', label: 'Today'   },
  { to: '/workout', icon: '🏋️', label: 'Workout' },
  { to: '/progress',icon: '📈', label: 'Progress'},
  { to: '/log',     icon: '📝', label: 'Daily'   },
  { to: '/plan',    icon: '📋', label: 'Plan'    },
]

export default function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-t border-slate-700 z-50 safe-area-inset-bottom">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 pt-3 pb-3 transition-colors ${
                isActive ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
