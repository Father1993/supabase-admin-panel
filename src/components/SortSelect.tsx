'use client'

type Props = {
  value: 'desc' | 'asc'
  onChange: (value: 'desc' | 'asc') => void
  label?: string
}

export const SortSelect = ({
  value,
  onChange,
  label = 'Сортировка по дате обновления:',
}: Props) => (
  <div>
    <label className='block text-sm font-medium text-gray-700 mb-2'>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'desc' | 'asc')}
      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
    >
      <option value='desc'>Сначала свежие</option>
      <option value='asc'>Сначала старые</option>
    </select>
  </div>
)
