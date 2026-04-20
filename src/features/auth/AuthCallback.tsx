import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session && !error) {
        navigate('/', { replace: true })
      } else {
        setError(true)
        setTimeout(() => navigate('/', { replace: true }), 3000)
      }
    })
  }, [navigate])

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center h-screen gap-3 font-sans">
      {error ? (
        <>
          <p className="text-red-700 text-base">הקישור פג תוקף או שגוי.</p>
          <p className="text-gray-500 text-sm">מועבר לדף ההתחברות...</p>
        </>
      ) : (
        <p className="text-gray-700">מתחבר...</p>
      )}
    </div>
  )
}
