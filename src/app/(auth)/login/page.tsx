'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.replace('/admin')
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <form
        onSubmit={onSubmit}
        className='w-full max-w-sm space-y-4 border p-6 rounded-md'
      >
        <h1 className='text-xl font-semibold'>Вход</h1>
        <div className='space-y-2'>
          <label className='block text-sm'>Email</label>
          <input
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full border rounded px-3 py-2'
          />
        </div>
        <div className='space-y-2'>
          <label className='block text-sm'>Пароль</label>
          <input
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full border rounded px-3 py-2'
          />
        </div>
        {error && (
          <p className='text-sm text-red-600' role='alert'>
            {error}
          </p>
        )}
        <button
          type='submit'
          disabled={loading}
          className='w-full bg-black text-white rounded py-2 disabled:opacity-60'
        >
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
