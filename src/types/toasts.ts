export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  tone: ToastTone
  duration: number
  open: boolean
}

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
}
