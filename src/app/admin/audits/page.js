// app/admin/clients/page.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import AdminAudits from './AdminAudits'
import { redirect } from 'next/navigation'

export default async function Page() {
	const session = await getServerSession(authOptions)

	if (!session || session.user.role !== 'ADMIN') {
		// Przekieruj, jeśli brak uprawnień
		return redirect('/login')
	}

	// Przekaż sesję jako prop do komponentu klienckiego
	return <AdminAudits session={session} />
}
