import React from 'react'
import OverviewStats from './_components/OverviewStats'
import RevenueChart from './_components/RevenueChart'
import ValueOverTime from './_components/ValueOverTime'
import RecentSong from './_components/RecentSong'

function page() {
  return (
    <div className="space-y-6">
      <OverviewStats />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)]">
        <div className="min-w-0">
          <RevenueChart />
        </div>
        <div className="min-w-0">
          <ValueOverTime />
        </div>
      </div>
      <RecentSong />
    </div>
  )
}

export default page
 