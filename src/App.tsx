import { useState } from 'react'
import { Header } from './components/Header'
import { DebugPanel } from './debug/DebugPanel'
import { Dashboard } from './features/dashboard/Dashboard'
import { TransferDialog } from './features/transfer/TransferDialog'

// Demo controls for reviewers, only with ?debug in the page URL.
const showDebug = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const [isTransferOpen, setTransferOpen] = useState(false)

  return (
    <>
      <Header />
      <main className="container app-main">
        <Dashboard onNewTransfer={() => setTransferOpen(true)} />
      </main>
      {showDebug && <DebugPanel />}
      {isTransferOpen && (
        <TransferDialog onClose={() => setTransferOpen(false)} />
      )}
    </>
  )
}
