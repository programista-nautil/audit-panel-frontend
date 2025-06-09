import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export const authOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					prompt: 'consent',
					access_type: 'offline',
					response_type: 'code',
					scope:
						'openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
				},
			},
		}),
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null
				}
				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				})

				if (!user || !user.passwordHash) return null

				const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
				if (!isValid) return null

				return { id: user.id, name: user.name, email: user.email, role: user.role }
			},
		}),
	],
	callbacks: {
		async signIn({ user, account, profile }) {
			// Dla logowania przez formularz, nic się nie zmienia
			if (account.provider === 'credentials') {
				return true
			}

			// Dla logowania przez Google, implementujemy nową, pełną logikę
			if (account.provider === 'google') {
				try {
					// 1. Sprawdź, czy użytkownik o tym e-mailu istnieje w bazie danych
					const userInDb = await prisma.user.findUnique({
						where: { email: user.email },
					})

					// 2. Jeśli użytkownik nie istnieje LUB nie ma roli ADMIN, zablokuj logowanie
					if (!userInDb || userInDb.role !== 'ADMIN') {
						return false
					}

					// 3. Jeśli użytkownik istnieje i jest adminem, sprawdź, czy konto jest już połączone
					const accountInDb = await prisma.account.findUnique({
						where: {
							provider_providerAccountId: {
								provider: 'google',
								providerAccountId: account.providerAccountId,
							},
						},
					})

					// 4. Jeśli konto NIE jest połączone, stwórz to połączenie
					if (!accountInDb) {
						await prisma.account.create({
							data: {
								userId: userInDb.id,
								type: account.type,
								provider: account.provider,
								providerAccountId: account.providerAccountId,
								access_token: account.access_token,
								expires_at: account.expires_at,
								refresh_token: account.refresh_token,
								scope: account.scope,
								id_token: account.id_token,
								token_type: account.token_type,
							},
						})
					}

					// 5. Zezwól na logowanie
					return true
				} catch (error) {
					console.error('Błąd podczas łączenia konta Google:', error)
					return false
				}
			}

			return false // Domyślnie zablokuj inne metody
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.sub
				session.user.role = token.role
			}
			return session
		},
		async jwt({ token, user }) {
			// Ten callback jest ważny, aby rola była poprawnie przekazywana do sesji
			if (user) {
				const userFromDb = await prisma.user.findUnique({ where: { email: user.email } })
				if (userFromDb) {
					token.role = userFromDb.role
				}
			}
			return token
		},
	},
	pages: {
		signIn: '/login',
	},
	session: {
		strategy: 'jwt',
	},
	secret: process.env.NEXTAUTH_SECRET,
}
