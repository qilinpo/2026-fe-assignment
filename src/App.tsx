import { Header } from './components/Header'
import { Dashboard } from './features/dashboard/Dashboard'

export default function App() {
  return (
    <>
      <Header />
      <main className="container app-main">
        <Dashboard />
      </main>
    </>
  )
}
