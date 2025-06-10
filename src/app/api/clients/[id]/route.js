import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(_, props) {
    const params = await props.params;
    const clientId = params.id

    // Usuń najpierw audyty klienta (łącznie z plikami)
    await prisma.file.deleteMany({ where: { audit: { clientId } } })
    await prisma.audit.deleteMany({ where: { clientId } })

    // Usuń klienta
    await prisma.user.delete({ where: { id: clientId } })

    return NextResponse.json({ success: true })
}
