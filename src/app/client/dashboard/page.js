// app/admin/clients/page.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import ClientDashboard from './ClientDashboard'
import { redirect } from 'next/navigation'

export default async function Page() {
	const session = await getServerSession(authOptions)

	if (!session || session.user.role !== 'CLIENT') {
		// Przekieruj, jeśli brak uprawnień
		return redirect('/login')
	}

	// Przekaż sesję jako prop do komponentu klienckiego
	return <ClientDashboard session={session} />
}
