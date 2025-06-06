import { prisma } from '@/lib/prisma'

/**
 * Pobiera wszystkie audyty
 */
export async function getAudits() {
	try {
		const audits = await prisma.audit.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				client: {
					// Dołączamy podstawowe dane klienta
					select: { name: true },
				},
			},
		})
		return audits
	} catch (error) {
		console.error('Błąd bazy danych przy pobieraniu audytów:', error)
		throw new Error('Nie udało się pobrać audytów.')
	}
}

/**
 * Pobiera wszystkich klientów z ich audytami i raportami
 */
export async function getClients() {
	try {
		const clients = await prisma.user.findMany({
			where: { role: 'CLIENT' },
			include: {
				audits: {
					include: {
						reports: true,
					},
				},
			},
		})

		// Usuwamy hashe haseł
		const clientsWithoutPassword = clients.map(client => {
			const { passwordHash, ...clientData } = client
			return clientData
		})
		return clientsWithoutPassword
	} catch (error) {
		console.error('Błąd bazy danych przy pobieraniu klientów:', error)
		throw new Error('Nie udało się pobrać klientów.')
	}
}
