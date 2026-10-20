import React, { Suspense } from 'react'
import ResetPasswordForm from './_components/reset-password-form'

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

export default ResetPasswordPage
