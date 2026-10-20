import Image from 'next/image'
import React from 'react'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='min-h-dvh w-full bg-black lg:grid lg:grid-cols-2'>
      <div className='relative hidden overflow-hidden lg:block lg:min-h-dvh'>
        <Image
          src="/auth_image.png"
          alt="Auth Image"
          fill
          priority
          className='object-cover'
          sizes="(max-width: 1023px) 100vw, 50vw"
        />
        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-14 sm:px-5 sm:pb-5 md:px-6 md:pb-6 lg:px-8 lg:pb-8'>
          <p className='text-base font-bold leading-snug text-[#F5F5F5] sm:text-lg md:text-xl lg:text-2xl xl:text-[28px]'>
            "The music platform that makes commercial <br className="hidden md:block" /> licensing effortless."
          </p>
        </div>
      </div>

      <div className='flex min-h-dvh min-w-0 items-center justify-center px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10'>
        <div className='flex w-full items-center justify-center'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
