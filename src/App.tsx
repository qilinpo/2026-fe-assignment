import { Header } from './components/Header'
import { SegmentSwitch } from './theme/SegmentSwitch'

export default function App() {
  return (
    <>
      <Header />
      <main className="container app-main">
        {/* Below 640px the header has no room; phase 2 moves this under the greeting. */}
        <SegmentSwitch className="mobile-only" />
        {/* Dashboard lands here in phase 2. */}
      </main>
    </>
  )
}
