import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// export async function POST(req) {
// 	const session = await getServerSession(authOptions)
// 	if (!session || session.user.role !== 'ADMIN') {
// 		return new NextResponse('Unauthorized', { status: 401 })
// 	}

// 	const data = await req.formData()
// 	const clientId = data.get('clientId')
// 	const title = data.get('title')
// 	const file = data.get('file')

// 	const bytes = await file.arrayBuffer()
// 	const buffer = Buffer.from(bytes)

// 	const filename = `${uuid()}.pdf`
// 	const uploadPath = path.join(process.cwd(), 'public/uploads', filename)
// 	await writeFile(uploadPath, buffer)

// 	const audit = await prisma.audit.create({
// 		data: {
// 			title,
// 			clientId,
// 			createdById: session.user.id,
// 			status: 'DRAFT',
// 			files: {
// 				create: [
// 					{
// 						filename,
// 						url: `/uploads/${filename}`,
// 						type: 'PDF',
// 					},
// 				],
// 			},
// 		},
// 	})

// 	return NextResponse.json(audit)
// }

export async function POST(req) {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'ADMIN') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const { title, url, clientId } = body

	if (!title || !url) {
		return new NextResponse('Missing fields', { status: 400 })
	}

	const audit = await prisma.audit.create({
		data: {
			title,
			url,
			status: 'DRAFT',
			client: { connect: { id: clientId } },
			createdBy: { connect: { id: session.user.id } },
		},
	})

	return NextResponse.json(audit)
}

export async function GET() {
	const session = await getServerSession(authOptions)
	console.log(session)

	if (!session || session.user.role !== 'ADMIN') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	try {
		const audits = await prisma.audit.findMany({
			orderBy: { createdAt: 'desc' },
		})
		return NextResponse.json(audits)
	} catch (error) {
		console.error('Błąd przy pobieraniu audytów:', error)
		return new NextResponse('Błąd serwera', { status: 500 })
	}
}
