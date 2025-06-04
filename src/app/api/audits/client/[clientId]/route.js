import { prisma } from '@/lib/prisma'

export async function GET(req, { params }) {
	const clientId = await params.clientId

	const audits = await prisma.audit.findMany({
		where: { clientId },
		include: { files: true },
		orderBy: { createdAt: 'desc' },
	})

	return Response.json(audits)
}
