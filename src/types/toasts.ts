export enum ToastTone {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

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
