import { HashRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AuthGate from './components/AuthGate'
import PasswordGate from './components/PasswordGate'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import WorkoutLog from './pages/WorkoutLog'
import Progress from './pages/Progress'
import DailyLog from './pages/DailyLog'
import PlanRef from './pages/PlanRef'
import Settings from './pages/Settings'

// Use Supabase auth when credentials are configured, fallback to local password gate
const Gate = supabase ? AuthGate : PasswordGate

export default function App() {
  return (
    <HashRouter>
      <Gate>
        <div className="min-h-screen bg-slate-900">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/workout"  element={<WorkoutLog />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/log"      element={<DailyLog />} />
            <Route path="/plan"     element={<PlanRef />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <Nav />
        </div>
      </Gate>
    </HashRouter>
  )
}
