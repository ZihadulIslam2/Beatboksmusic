import React from 'react'
import { MyPlaylist } from './_components/MyPlaylist'
import { FeaturedPlaylist } from '@/components/web-components/FeaturedPlaylist'

const page = () => {
  return (
    <div>
      <MyPlaylist/>
      <FeaturedPlaylist/>
    </div>
  )
}

export default page
