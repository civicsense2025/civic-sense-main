import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
      <p className="mb-4">Welcome {user.email}!</p>
      <p className="mb-4">This page is only visible to authenticated users.</p>
      <SignOutButton />
    </div>
  )
} 