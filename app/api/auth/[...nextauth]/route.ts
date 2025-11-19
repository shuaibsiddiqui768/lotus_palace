import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB()
      const existingUser = await User.findOne({ googleId: profile?.sub })
      if (!existingUser) {
        const newUser = new User({
          name: user.name,
          email: user.email,
          googleId: profile?.sub,
          provider: 'google',
        })
        await newUser.save()
      }
      return true
    },
    async session({ session, token }) {
      await connectDB()
      const dbUser = await User.findOne({ googleId: token.sub })
      if (dbUser) {
        session.user.id = dbUser._id.toString()
        session.user.tableNumber = dbUser.tableNumber
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.sub = profile?.sub
      }
      return token
    },
  },
})

export { handler as GET, handler as POST }