import React, { useState } from 'react';

export default function ResumeUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please select a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setStatus('Uploading...');
    try {
      const res = await fetch('http://127.0.0.1:3000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      let data = {};
      try { data = await res.json(); } catch {
        // Ignore JSON parse errors
      }
      if (res.ok) {
        setStatus('Upload successful!');
        if (onUpload) onUpload();
      } else {
        setStatus((data && data.error) || 'Upload failed.');
      }
    } catch {
      setStatus('Error uploading file.');
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: '100%' }}>
      <label style={{ fontWeight: 500, marginBottom: 2, color: '#444' }} htmlFor="resume-upload-input">
        Upload Resume (PDF, DOC, DOCX):
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <label htmlFor="resume-upload-input" style={{
          border: '2px solid #6366f1',
          borderRadius: 6,
          padding: '6px 12px',
          background: '#f9fafb',
          fontSize: 15,
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
        }}>
          <span style={{ color: '#444', fontWeight: 500, flex: 1 }}>
            {file ? file.name : 'Choose File'}
          </span>
          {file && (
            <span
              onClick={e => { e.stopPropagation(); setFile(null); setStatus(''); }}
              style={{
                marginLeft: 8,
                color: '#d32f2f',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                userSelect: 'none',
                border: 'none',
                background: 'none',
                outline: 'none',
              }}
              title="Remove file"
            >
              ×
            </span>
          )}
          <input
            id="resume-upload-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            style={{
              display: 'none',
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            background: '#222',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            border: '2px solid #6366f1',
            borderRadius: 6,
            padding: '8px 24px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Upload
        </button>
      </div>
      <div style={{ color: status.includes('successful') ? 'green' : 'red', marginTop: 5, fontSize: 14 }}>{status}</div>
    </form>
  );
}
