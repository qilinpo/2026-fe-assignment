import { useState } from 'react'
import { Header } from './components/Header'
import { Dashboard } from './features/dashboard/Dashboard'
import { TransferDialog } from './features/transfer/TransferDialog'

export default function App() {
  const [isTransferOpen, setTransferOpen] = useState(false)

  return (
    <>
      <Header />
      <main className="container app-main">
        <Dashboard onNewTransfer={() => setTransferOpen(true)} />
      </main>
      {isTransferOpen && (
        <TransferDialog onClose={() => setTransferOpen(false)} />
      )}
    </>
  )
}
