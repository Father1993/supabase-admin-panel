'use client'

import { Vendor } from '@/types/vendors'

type Props = {
  vendor: Vendor
  additionalBadges?: React.ReactNode[]
}

export function VendorHeader({ vendor, additionalBadges = [] }: Props) {
  return (
    <div className='bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          {vendor.vendor_name && (
            <h2 className='text-xl font-bold text-slate-900 mb-2'>
              {vendor.vendor_name}
            </h2>
          )}
          <div className='flex flex-wrap gap-4 text-sm'>
            {vendor.owner_name && (
              <span className='bg-blue-100 px-3 py-1 rounded-full'>
                <span className='text-blue-600 font-medium'>Владелец:</span>
                <span className='text-blue-800 ml-1'>{vendor.owner_name}</span>
              </span>
            )}
            {vendor.city && (
              <span className='bg-violet-100 px-3 py-1 rounded-full'>
                <span className='text-violet-600 font-medium'>Город:</span>
                <span className='text-violet-800 ml-1'>{vendor.city}</span>
              </span>
            )}
            {vendor.inn && (
              <span className='bg-teal-100 px-3 py-1 rounded-full'>
                <span className='text-teal-600 font-medium'>ИНН:</span>
                <span className='text-teal-800 ml-1'>{vendor.inn}</span>
              </span>
            )}
            {additionalBadges.map((badge, index) => (
              <span key={index}>{badge}</span>
            ))}
          </div>
        </div>
        {vendor.created_at && (
          <div className='text-sm text-slate-500'>
            {new Date(vendor.created_at).toLocaleDateString('ru')}
          </div>
        )}
      </div>
    </div>
  )
}
