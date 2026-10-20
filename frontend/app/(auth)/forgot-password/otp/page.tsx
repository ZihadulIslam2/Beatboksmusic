import React, { Suspense } from 'react'
import OtpForm from './_components/otp-form'

const OtpPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtpForm />
    </Suspense>
  )
}

export default OtpPage
