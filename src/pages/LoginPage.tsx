import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Mode = 'signin' | 'signup' | 'magic-link'

export function LoginPage() {
  const { session, signInWithPassword, signUpWithPassword, signInWithMagicLink } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const result =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : mode === 'signup'
          ? await signUpWithPassword(email, password)
          : await signInWithMagicLink(email)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'signup') {
      setMessage('Cuenta creada. Revisa tu correo para confirmar el registro.')
    } else if (mode === 'magic-link') {
      setMessage('Te enviamos un enlace mágico a tu correo.')
    }
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="mb-1 text-xl font-semibold text-white">Finanzas</h1>
        <p className="mb-6 text-sm text-gray-400">
          {mode === 'signin' && 'Inicia sesión en tu cuenta'}
          {mode === 'signup' && 'Crea una cuenta nueva'}
          {mode === 'magic-link' && 'Inicia sesión con un enlace mágico'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />

          {mode !== 'magic-link' && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          )}

          {error && <p className="text-sm text-negative">{error}</p>}
          {message && <p className="text-sm text-positive">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {mode === 'signin' && 'Entrar'}
            {mode === 'signup' && 'Registrarme'}
            {mode === 'magic-link' && 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-1 text-center text-sm text-gray-400">
          {mode === 'signin' ? (
            <button onClick={() => setMode('signup')} className="hover:text-white">
              ¿No tienes cuenta? Regístrate
            </button>
          ) : (
            <button onClick={() => setMode('signin')} className="hover:text-white">
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          )}

          {mode !== 'magic-link' ? (
            <button onClick={() => setMode('magic-link')} className="hover:text-white">
              Usar enlace mágico en su lugar
            </button>
          ) : (
            <button onClick={() => setMode('signin')} className="hover:text-white">
              Usar contraseña en su lugar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
