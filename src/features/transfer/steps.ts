export const STEPS = [
  { id: 'recipient', label: 'Recipient', title: 'Who are you sending to?' },
  { id: 'amount', label: 'Amount', title: 'How much?' },
  { id: 'review', label: 'Review', title: 'Check the details' },
] as const

export type Step = (typeof STEPS)[number]
