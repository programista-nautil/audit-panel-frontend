import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PanelLayout from '@/components/layout/PanelLayout'

export default async function ClientAuditsPage() {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'CLIENT') {
		return <p>Brak dostępu</p>
	}

	const audits = await prisma.audit.findMany({
		where: { clientId: session.user.id },
		include: { files: true },
	})

	return (
		<PanelLayout session={session}>
			<h1 className='text-2xl font-bold mb-6'>Moje audyty</h1>
			<ul className='space-y-4'>
				{audits.map(a => (
					<li key={a.id} className='border p-4 rounded'>
						<h2 className='font-semibold'>{a.title}</h2>
						<p>Status: {a.status}</p>
						{a.files.map(f => (
							<a key={f.id} href={f.url} className='text-blue-600 underline' target='_blank'>
								Pobierz PDF
							</a>
						))}
					</li>
				))}
			</ul>
		</PanelLayout>
	)
}
