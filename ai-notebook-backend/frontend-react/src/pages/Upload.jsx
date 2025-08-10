import React from 'react'
import { Upload as UploadWidget } from '../components/Upload.jsx'

export default function Upload({ base = '' }) {
  return (
    <div className="container-custom" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Upload documents</h2>
      <UploadWidget base={base} />
    </div>
  )
}
