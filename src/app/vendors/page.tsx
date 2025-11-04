'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Vendor } from '@/types/vendors'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { VendorHeader } from '@/components/VendorHeader'
import { LoadingSpinner, ErrorMessage } from '@/components/UIStates'
import { FieldIcon } from '@/components/FieldIcon'
import { vendorIconMap } from '@/types/vendor-icons'

function IconWrapper({ field }: { field: string }) {
  return (
    <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
      <FieldIcon type={vendorIconMap[field] || 'document'} />
    </div>
  )
}

function ViewIcon({ field }: { field: string }) {
  return (
    <FieldIcon
      type={vendorIconMap[field] || 'document'}
      className='text-gray-400'
    />
  )
}

function TextareaIcon({ field }: { field: string }) {
  return (
    <div className='absolute left-3 top-3 text-gray-400'>
      <FieldIcon type={vendorIconMap[field] || 'document'} />
    </div>
  )
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Partial<Vendor>>({})
  const [searchText, setSearchText] = useState('')
  const [filterCity, setFilterCity] = useState<string>('')
  const [cities, setCities] = useState<string[]>([])
  const [sortOrder] = useState<'desc' | 'asc'>('desc')
  const pageSize = 50

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [page, selectedVendor, searchText, filterCity, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCities() {
    const { data } = await supabase
      .from('uroven_vendors')
      .select('city')
      .not('city', 'is', null)
    const uniqueCities = [
      ...new Set(data?.map((v) => v.city).filter(Boolean)),
    ].sort() as string[]
    setCities(uniqueCities)
  }

  async function fetchVendors() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('uroven_vendors')
        .select('*', { count: 'exact' })

      if (selectedVendor) {
        query = query.eq('id', selectedVendor.id)
      } else {
        if (searchText.trim()) {
          query = query.or(
            `vendor_name.ilike.%${searchText.trim()}%,owner_name.ilike.%${searchText.trim()}%,phone.ilike.%${searchText.trim()}%,email.ilike.%${searchText.trim()}%`
          )
        }

        if (filterCity) {
          query = query.eq('city', filterCity)
        }

        query = query
          .order('created_at', { ascending: sortOrder === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1)
      }

      const { data, error, count } = await query

      if (error) {
        setError(error.message)
      } else {
        setVendors(data || [])
        setTotal(count || 0)
      }
    } catch {
      setError('Ошибка загрузки данных')
    }
    setLoading(false)
  }

  async function handleSave(vendorId: string) {
    const isNew = vendorId === 'new'
    const { error } = isNew
      ? await supabase.from('uroven_vendors').insert(editedData)
      : await supabase
          .from('uroven_vendors')
          .update(editedData)
          .eq('id', vendorId)

    if (error) {
      setError(error.message)
    } else {
      setEditingId(null)
      setEditedData({})
      fetchVendors()
      fetchCities()
    }
  }

  async function handleDelete(vendorId: string) {
    if (!confirm('Удалить этот магазин?')) return

    const { error } = await supabase
      .from('uroven_vendors')
      .delete()
      .eq('id', vendorId)

    if (error) {
      setError(error.message)
    } else {
      fetchVendors()
      fetchCities()
    }
  }

  function handleEdit(vendor: Vendor) {
    setEditingId(vendor.id)
    setEditedData({ ...vendor })
  }

  function handleCreate() {
    setEditingId('new')
    setEditedData({})
    setSelectedVendor(null)
  }

  function handleCancel() {
    setEditingId(null)
    setEditedData({})
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Список магазинов'
        subtitle='Управление информацией о магазинах'
      />

      <div className='max-w-7xl mx-auto px-4 py-6 space-y-4'>
        {!selectedVendor && editingId !== 'new' && (
          <div className='bg-white rounded-lg border p-4'>
            <button
              onClick={handleCreate}
              className='flex items-center gap-2 px-5 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium'
            >
              <span>➕</span>
              Создать новый магазин
            </button>
          </div>
        )}
        {selectedVendor && (
          <div className='bg-white rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>
                Выбран магазин:{' '}
                <strong>
                  {selectedVendor.vendor_name || selectedVendor.id}
                </strong>
              </span>
              <button
                onClick={() => {
                  setSelectedVendor(null)
                  setPage(1)
                }}
                className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1'
              >
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
                Показать все магазины
              </button>
            </div>
          </div>
        )}
        {!selectedVendor && (
          <div className='bg-white rounded-lg border p-4 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Поиск по названию, владельцу, телефону или email:
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
                    <svg
                      width='18'
                      height='18'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <circle cx='11' cy='11' r='8' />
                      <path d='m21 21-4.35-4.35' />
                    </svg>
                  </div>
                  <input
                    type='text'
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value)
                      setPage(1)
                    }}
                    placeholder='Введите текст для поиска...'
                    className='w-full px-4 py-2 pl-10 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Фильтр по городу:
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => {
                    setFilterCity(e.target.value)
                    setPage(1)
                  }}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
                >
                  <option value=''>Все города</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(searchText || filterCity) && (
              <div className='flex items-center gap-2 flex-wrap'>
                <button
                  onClick={() => {
                    setSearchText('')
                    setFilterCity('')
                    setPage(1)
                  }}
                  className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1'
                >
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !selectedVendor && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}

        {!loading && !error && (
          <div className='space-y-6'>
            {editingId === 'new' && (
              <div className='bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden'>
                <div className='bg-green-50 px-6 py-4 border-b border-green-200'>
                  <h3 className='text-lg font-semibold text-green-900'>
                    ➕ Создание нового магазина
                  </h3>
                </div>
                <div className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Название магазина
                        </label>
                        <div className='relative'>
                          <IconWrapper field='vendor_name' />
                          <input
                            type='text'
                            value={editedData.vendor_name ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                vendor_name: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Владелец
                        </label>
                        <div className='relative'>
                          <IconWrapper field='owner_name' />
                          <input
                            type='text'
                            value={editedData.owner_name ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                owner_name: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          ИНН
                        </label>
                        <div className='relative'>
                          <IconWrapper field='inn' />
                          <input
                            type='number'
                            value={editedData.inn ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                inn: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Город
                        </label>
                        <div className='relative'>
                          <IconWrapper field='city' />
                          <input
                            type='text'
                            value={editedData.city ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                city: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Адрес
                        </label>
                        <div className='relative'>
                          <TextareaIcon field='address' />
                          <textarea
                            value={editedData.address ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                address: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Широта
                          </label>
                          <div className='relative'>
                            <IconWrapper field='latitude' />
                            <input
                              type='number'
                              step='any'
                              value={editedData.latitude ?? ''}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  latitude: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                })
                              }
                              className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                            />
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Долгота
                          </label>
                          <div className='relative'>
                            <IconWrapper field='longitude' />
                            <input
                              type='number'
                              step='any'
                              value={editedData.longitude ?? ''}
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  longitude: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                })
                              }
                              className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Склад 1С
                        </label>
                        <div className='relative'>
                          <IconWrapper field='warehouse_1c' />
                          <input
                            type='text'
                            value={editedData.warehouse_1c ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                warehouse_1c: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Тип цены
                        </label>
                        <div className='relative'>
                          <IconWrapper field='price_type' />
                          <input
                            type='text'
                            value={editedData.price_type ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                price_type: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                    </div>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Телефон
                        </label>
                        <div className='relative'>
                          <IconWrapper field='phone' />
                          <input
                            type='text'
                            value={editedData.phone ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                phone: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          WhatsApp
                        </label>
                        <div className='relative'>
                          <IconWrapper field='whatsapp' />
                          <input
                            type='text'
                            value={editedData.whatsapp ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                whatsapp: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Telegram
                        </label>
                        <div className='relative'>
                          <IconWrapper field='telegram' />
                          <input
                            type='text'
                            value={editedData.telegram ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                telegram: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Email
                        </label>
                        <div className='relative'>
                          <IconWrapper field='email' />
                          <input
                            type='email'
                            value={editedData.email ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                email: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Юридический телефон
                        </label>
                        <div className='relative'>
                          <IconWrapper field='juridical_phone' />
                          <input
                            type='text'
                            value={editedData.juridical_phone ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                juridical_phone: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          График работы
                        </label>
                        <div className='relative'>
                          <TextareaIcon field='schedule' />
                          <textarea
                            value={editedData.schedule ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                schedule: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                            rows={2}
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Ссылка OK
                        </label>
                        <div className='relative'>
                          <IconWrapper field='ok_link' />
                          <input
                            type='url'
                            value={editedData.ok_link ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                ok_link: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Ссылка VK
                        </label>
                        <div className='relative'>
                          <IconWrapper field='vk_link' />
                          <input
                            type='url'
                            value={editedData.vk_link ?? ''}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                vk_link: e.target.value,
                              })
                            }
                            className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='mt-6 flex justify-end gap-2'>
                    <button
                      onClick={handleCancel}
                      className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300'
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleSave('new')}
                      className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                    >
                      Создать
                    </button>
                  </div>
                </div>
              </div>
            )}
            {vendors.map((vendor) => {
              const isEditing = editingId === vendor.id
              const data = isEditing ? { ...vendor, ...editedData } : vendor

              return (
                <div
                  key={vendor.id}
                  className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'
                >
                  <VendorHeader vendor={vendor} />
                  <div className='p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Название магазина
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='vendor_name' />
                              <input
                                type='text'
                                value={data.vendor_name ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    vendor_name: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='vendor_name' />
                              {vendor.vendor_name || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Владелец
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='owner_name' />
                              <input
                                type='text'
                                value={data.owner_name ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    owner_name: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='owner_name' />
                              {vendor.owner_name || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            ИНН
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='inn' />
                              <input
                                type='number'
                                value={data.inn ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    inn: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='inn' />
                              {vendor.inn ?? '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Город
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='city' />
                              <input
                                type='text'
                                value={data.city ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    city: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='city' />
                              {vendor.city || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Адрес
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <TextareaIcon field='address' />
                              <textarea
                                value={data.address ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    address: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                                rows={2}
                              />
                            </div>
                          ) : (
                            <div className='flex items-start gap-2 text-gray-900'>
                              <FieldIcon
                                type='location'
                                className='text-gray-400 mt-0.5'
                              />
                              <span>{vendor.address || '-'}</span>
                            </div>
                          )}
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Широта
                            </label>
                            {isEditing ? (
                              <div className='relative'>
                                <IconWrapper field='latitude' />
                                <input
                                  type='number'
                                  step='any'
                                  value={data.latitude ?? ''}
                                  onChange={(e) =>
                                    setEditedData({
                                      ...editedData,
                                      latitude: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                  className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                                />
                              </div>
                            ) : (
                              <div className='flex items-center gap-2 text-gray-900'>
                                <ViewIcon field='latitude' />
                                {vendor.latitude ?? '-'}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Долгота
                            </label>
                            {isEditing ? (
                              <div className='relative'>
                                <IconWrapper field='longitude' />
                                <input
                                  type='number'
                                  step='any'
                                  value={data.longitude ?? ''}
                                  onChange={(e) =>
                                    setEditedData({
                                      ...editedData,
                                      longitude: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                  className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                                />
                              </div>
                            ) : (
                              <div className='flex items-center gap-2 text-gray-900'>
                                <ViewIcon field='longitude' />
                                {vendor.longitude ?? '-'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Склад 1С
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='warehouse_1c' />
                              <input
                                type='text'
                                value={data.warehouse_1c ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    warehouse_1c: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='warehouse_1c' />
                              {vendor.warehouse_1c || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Тип цены
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='price_type' />
                              <input
                                type='text'
                                value={data.price_type ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    price_type: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='price_type' />
                              {vendor.price_type || '-'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Телефон
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='phone' />
                              <input
                                type='text'
                                value={data.phone ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    phone: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='phone' />
                              {vendor.phone || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            WhatsApp
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='whatsapp' />
                              <input
                                type='text'
                                value={data.whatsapp ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    whatsapp: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <FieldIcon
                                type='whatsapp'
                                fill='currentColor'
                                className='text-gray-400'
                              />
                              {vendor.whatsapp || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Telegram
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='telegram' />
                              <input
                                type='text'
                                value={data.telegram ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    telegram: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <FieldIcon
                                type='telegram'
                                fill='currentColor'
                                className='text-gray-400'
                              />
                              {vendor.telegram || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Email
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='email' />
                              <input
                                type='email'
                                value={data.email ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    email: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='email' />
                              {vendor.email || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Юридический телефон
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='juridical_phone' />
                              <input
                                type='text'
                                value={data.juridical_phone ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    juridical_phone: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='juridical_phone' />
                              {vendor.juridical_phone || '-'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            График работы
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <TextareaIcon field='schedule' />
                              <textarea
                                value={data.schedule ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    schedule: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                                rows={2}
                              />
                            </div>
                          ) : (
                            <div className='flex items-start gap-2 text-gray-900'>
                              <FieldIcon
                                type='clock'
                                className='text-gray-400 mt-0.5'
                              />
                              <span>{vendor.schedule || '-'}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Ссылка OK
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='ok_link' />
                              <input
                                type='url'
                                value={data.ok_link ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    ok_link: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='ok_link' />
                              {vendor.ok_link ? (
                                <a
                                  href={vendor.ok_link}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:underline'
                                >
                                  {vendor.ok_link}
                                </a>
                              ) : (
                                '-'
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Ссылка VK
                          </label>
                          {isEditing ? (
                            <div className='relative'>
                              <IconWrapper field='vk_link' />
                              <input
                                type='url'
                                value={data.vk_link ?? ''}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    vk_link: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 bg-white'
                              />
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 text-gray-900'>
                              <ViewIcon field='vk_link' />
                              {vendor.vk_link ? (
                                <a
                                  href={vendor.vk_link}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:underline'
                                >
                                  {vendor.vk_link}
                                </a>
                              ) : (
                                '-'
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='mt-6 flex justify-end gap-2'>
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancel}
                            className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300'
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => handleSave(vendor.id)}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                          >
                            Сохранить
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
                          >
                            Удалить
                          </button>
                          <button
                            onClick={() => handleEdit(vendor)}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                          >
                            Редактировать
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !selectedVendor && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
