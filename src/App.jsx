import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Play from './pages/Play.jsx'
import Admin from './pages/Admin.jsx'
import Plan from './pages/Plan.jsx'
import Rules from './pages/Rules.jsx'
import UpdateBanner from './components/UpdateBanner.jsx'
import { supabaseConfigured } from './lib/supabase'

function ConfigBanner() {
  if (supabaseConfigured) return null
  return (
    <div className="bg-gold text-ink text-sm font-semibold px-4 py-2 text-center">
      ⚠️ Supabase nicht konfiguriert – bitte <code>.env</code> ausfüllen (siehe README). Realtime ist deaktiviert.
    </div>
  )
}

export default function App() {
  return (
    <>
      <UpdateBanner />
      <ConfigBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:sessionId" element={<Play />} />
        <Route path="/admin/:sessionId" element={<Admin />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/regeln" element={<Rules />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
