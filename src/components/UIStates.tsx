export const LoadingSpinner = ({ text = 'Загрузка...' }: { text?: string }) => (
  <div className='flex items-center justify-center py-12'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
    <p className='text-slate-600 ml-3'>{text}</p>
  </div>
)

export const ErrorMessage = ({ error }: { error: string }) => (
  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
    <p className='text-red-800'>Ошибка: {error}</p>
  </div>
)

export const EmptyState = ({ message }: { message: string }) => (
  <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 text-center'>
    <p className='text-blue-800'>{message}</p>
  </div>
)
