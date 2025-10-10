'use client'
import { ADMIN_EMAILS } from '@/config/admin'

type Props = {
  emails: string[]
  selected: string | null
  onChange: (email: string | null) => void
  currentUser: string | null
  hasNoEmailItems?: boolean
}

export const UserFilter = ({ emails, selected, onChange, currentUser, hasNoEmailItems = true }: Props) => {
  if (!currentUser || !ADMIN_EMAILS.includes(currentUser)) return null
  if (!emails.length) return null

  return (
    <div>
      <label className='block text-sm font-medium text-gray-700 mb-2'>
        Фильтр по пользователю:
      </label>
      <select
        value={selected || '__all__'}
        onChange={(e) => onChange(e.target.value === '__all__' ? null : e.target.value)}
        className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white'
      >
        <option value='__all__'>Все пользователи</option>
        {hasNoEmailItems && <option value='__no_email__'>Без почты</option>}
        {emails.map(email => (
          <option key={email} value={email}>{email}</option>
        ))}
      </select>
    </div>
  )
}

