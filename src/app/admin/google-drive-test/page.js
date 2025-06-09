// app/admin/clients/page.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import AdminTest from './AdminTest'
import { redirect } from 'next/navigation'

export default async function Page() {
	const session = await getServerSession(authOptions)

	if (!session || session.user.role !== 'ADMIN') {
		// Przekieruj, jeśli brak uprawnień
		return redirect('/login')
	}

	// Przekaż sesję jako prop do komponentu klienckiego
	return <AdminTest session={session} />
}
