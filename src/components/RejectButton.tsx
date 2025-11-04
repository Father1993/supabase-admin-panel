'use client'

import { RejectButtonProps } from '@/types/main'

export function RejectButton({ row, onReject }: RejectButtonProps) {
  return (
    <button
      onClick={() => onReject(row)}
      className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
    >
      Отклонить описание
    </button>
  )
}
