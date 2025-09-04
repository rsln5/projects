import React from 'react'

const KEY = 'releases_db_v1'
const KYC_KEY = 'kyc_demo_state_v1'

export function loadReleases() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

export function saveRelease(r) {
  const arr = [r, ...loadReleases()]
  localStorage.setItem(KEY, JSON.stringify(arr))
  window.dispatchEvent(new Event('releases:updated'))
  return arr
}

export function useMergedReleases(samples) {
  const [user, setUser] = React.useState(loadReleases())
  React.useEffect(() => {
    const upd = () => setUser(loadReleases())
    window.addEventListener('releases:updated', upd)
    window.addEventListener('storage', upd)
    return () => {
      window.removeEventListener('releases:updated', upd)
      window.removeEventListener('storage', upd)
    }
  }, [])
  return React.useMemo(() => [...user, ...samples], [user, samples])
}

export function kycStatus() {
  try { return (JSON.parse(localStorage.getItem(KYC_KEY)) || {}).status || 'guest' } catch { return 'guest' }
}
