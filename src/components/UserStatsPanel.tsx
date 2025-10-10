'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ADMIN_EMAILS } from '@/config/admin'

type Stats = {
  email: string | null
  approved?: number
  rejected?: number
  replace_later?: number
}[]
type EntityType = 'images' | 'categories' | 'products'

export const UserStatsPanel = ({ type }: { type: EntityType }) => {
  const [stats, setStats] = useState<Stats>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return

      setIsAdmin(true)

      if (type === 'images') {
        const { data } = await supabase
          .from('products')
          .select('image_confirmed_by_email, image_status')
          .in('image_status', ['approved', 'rejected', 'replace_later'])

        const grouped = data?.reduce(
          (acc, item) => {
            const email = item.image_confirmed_by_email || '__no_email__'
            if (!acc[email])
              acc[email] = { approved: 0, rejected: 0, replace_later: 0 }
            acc[email][
              item.image_status as 'approved' | 'rejected' | 'replace_later'
            ]++
            return acc
          },
          {} as Record<
            string,
            { approved: number; rejected: number; replace_later: number }
          >
        )

        setStats(
          Object.entries(grouped || {})
            .map(([email, counts]) => ({ email, ...counts }))
            .sort((a, b) => (b.approved || 0) - (a.approved || 0))
        )
      } else {
        const [{ data: approved }, { data: rejected }] = await Promise.all([
          supabase
            .from(type)
            .select('confirmed_by_email')
            .eq('description_confirmed', true),
          supabase
            .from(type)
            .select('confirmed_by_email')
            .eq('is_rejected', true),
        ])

        const grouped = {} as Record<
          string,
          { approved: number; rejected: number }
        >
        approved?.forEach((item) => {
          const email = item.confirmed_by_email || '__no_email__'
          if (!grouped[email]) grouped[email] = { approved: 0, rejected: 0 }
          grouped[email].approved++
        })
        rejected?.forEach((item) => {
          const email = item.confirmed_by_email || '__no_email__'
          if (!grouped[email]) grouped[email] = { approved: 0, rejected: 0 }
          grouped[email].rejected++
        })

        setStats(
          Object.entries(grouped)
            .map(([email, counts]) => ({ email, ...counts }))
            .sort((a, b) => (b.approved || 0) - (a.approved || 0))
        )
      }
    }
    fetchStats()
  }, [type])

  if (!isAdmin || !stats.length) return null

  const title = {
    images: 'изображений',
    categories: 'категорий',
    products: 'товаров',
  }[type]

  return (
    <div className='bg-indigo-50 border border-indigo-200 rounded-lg p-5 shadow-sm'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='text-lg font-bold text-indigo-700'>
          Статистика подтверждений {title}
        </h3>
        <div className='bg-indigo-100 text-indigo-600 text-xs rounded-full px-3 py-1'>
          Доступно только администраторам
        </div>
      </div>
      <div className='overflow-hidden rounded-lg border border-indigo-200 bg-white'>
        <table className='min-w-full divide-y divide-indigo-200'>
          <thead className='bg-indigo-50'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider'>
                Email сотрудника
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider'>
                Подтверждено
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider'>
                Отклонено
              </th>
              {type === 'images' && (
                <th className='px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider'>
                  Требует замены
                </th>
              )}
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-indigo-100'>
            {stats.map((stat, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}
              >
                <td className='px-4 py-2 whitespace-nowrap text-sm'>
                  {stat.email &&
                  stat.email !== '__no_email__' &&
                  stat.email !== 'null' ? (
                    <span className='text-gray-900'>{stat.email}</span>
                  ) : (
                    <span className='text-gray-500 italic'>Без почты</span>
                  )}
                </td>
                <td className='px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-700'>
                  {stat.approved || 0}
                </td>
                <td className='px-4 py-2 whitespace-nowrap text-sm font-medium text-red-600'>
                  {stat.rejected || 0}
                </td>
                {type === 'images' && (
                  <td className='px-4 py-2 whitespace-nowrap text-sm font-medium text-yellow-600'>
                    {stat.replace_later || 0}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
