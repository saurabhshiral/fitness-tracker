import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const NAV = [
  { to: '/',         icon: 'home',     label: 'Today'    },
  { to: '/workout',  icon: 'dumbbell', label: 'Train'    },
  { to: '/progress', icon: 'trending', label: 'Progress' },
  { to: '/log',      icon: 'notebook', label: 'Log'      },
  { to: '/plan',     icon: 'book',     label: 'Plan'     },
]

export default function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-700/60 z-50">
      <div className="flex max-w-lg mx-auto px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center gap-1 pt-3 pb-2.5 transition-colors duration-200 ${
                isActive ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* A small mark above the active tab reads faster than colour
                    alone, and stays legible for colour-blind users. */}
                <span
                  className={`absolute top-0 h-0.5 w-7 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-orange-400 opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon name={item.icon} size={21} strokeWidth={isActive ? 2 : 1.6} />
                <span className={`text-[10px] tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
