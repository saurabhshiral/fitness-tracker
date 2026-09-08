import { HashRouter, Routes, Route } from 'react-router-dom'
import PasswordGate from './components/PasswordGate'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import WorkoutLog from './pages/WorkoutLog'
import Progress from './pages/Progress'
import DailyLog from './pages/DailyLog'
import PlanRef from './pages/PlanRef'

export default function App() {
  return (
    <HashRouter>
      <PasswordGate>
        <div className="min-h-screen bg-slate-900">
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/workout" element={<WorkoutLog />} />
            <Route path="/progress"element={<Progress />} />
            <Route path="/log"     element={<DailyLog />} />
            <Route path="/plan"    element={<PlanRef />} />
          </Routes>
          <Nav />
        </div>
      </PasswordGate>
    </HashRouter>
  )
}
