const isAdminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === 'true'
if (isAdminMode && !user?.is_admin) {
  return <RedirectToAdminLogin />
} 