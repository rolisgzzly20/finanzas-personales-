import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="mb-1 text-xl font-semibold text-white">Nueva contraseña</h1>
        <p className="mb-6 text-sm text-gray-400">Elige una contraseña nueva para tu cuenta.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña nueva"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirma la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />

          {error && <p className="text-sm text-negative">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  )
}
