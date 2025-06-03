import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'

/**
 * Wrapper chroniący stronę (App Router)
 * @param {Object} options - role: wymagany typ użytkownika
 */
export function withAuth({ role } = {}) {
	return function ProtectedComponent(Component) {
		return async function AuthenticatedPage(props) {
			const session = await getServerSession(authOptions)

			// Brak sesji lub nieprawidłowa rola
			if (!session || (role && session.user.role !== role)) {
				return redirect('/admin/login')
			}

			// Przekazujemy sesję jako prop, jeśli chcesz jej użyć
			return <Component {...props} session={session} />
		}
	}
}
