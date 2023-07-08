import { ImageResponse } from 'next/server'
import { Icons } from './components/icons'

export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: '#222',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 10,
        }}
      >
        <Icons.logo style={{ width: 16, height: 16 }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
