import React, { useState } from 'react';
import axios from 'axios';
import ResumeUpload from './components/ResumeUpload';

// Minimal markdown parsing for a clean preview without extra dependencies.
const parseMarkdownSections = (markdown = '') => markdown.split('\n');

const renderResumePreview = lines => (
  <div>
    {lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: 6 }} />;
      if (trimmed.startsWith('###')) return <h4 key={idx} style={{ margin: '6px 0' }}>{trimmed.replace(/^###\s*/, '')}</h4>;
      if (trimmed.startsWith('##')) return <h3 key={idx} style={{ margin: '8px 0' }}>{trimmed.replace(/^##\s*/, '')}</h3>;
      if (trimmed.startsWith('#')) return <h2 key={idx} style={{ margin: '10px 0' }}>{trimmed.replace(/^#\s*/, '')}</h2>;
      if (trimmed.startsWith('- ')) return <div key={idx} style={{ display: 'flex', gap: 8, margin: '2px 0' }}><span>•</span><span>{trimmed.replace(/^-\s*/, '')}</span></div>;
      return <p key={idx} style={{ margin: '4px 0' }}>{trimmed}</p>;
    })}
  </div>
);

const App = () => {
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crafted, setCrafted] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');

  const handleCraftResume = async () => {
    if (!companyName.trim() || !role.trim() || !jobDescription.trim()) return;
    setError('');
    setCrafted(true);
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/save-jd', {
        companyName,
        role,
        jobDescription,
      });

      const res = await axios.post('http://localhost:3000/api/generate-resume', {
        companyName,
        role,
        jobDescription,
      });
      setResumeMarkdown(res.data?.resumeMarkdown || '');
    } catch (err) {
      console.error(err);
      setError('Failed to craft resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = async () => {
    if (!resumeMarkdown || !companyName.trim() || !role.trim()) {
      setError('Company, role, and resume are required to save.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/save-resume', {
        companyName,
        role,
        resumeMarkdown,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to save resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAts = async () => {
    if (!resumeMarkdown || !jobDescription) return;
    setAtsError('');
    setAtsLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/ats-score', {
        jobDescription,
        resumeMarkdown,
      });
      setAtsScore(res.data?.atsScore ?? null);
    } catch (err) {
      console.error(err);
      setAtsError('Failed to fetch ATS score.');
    } finally {
      setAtsLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setRole('');
    setJobDescription('');
    setResumeMarkdown('');
    setError('');
    setCrafted(false);
    setAtsScore(null);
    setAtsError('');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f4f5f7', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #f4f5f7;
          font-family: 'Inter', Arial, sans-serif;
        }
      `}</style>

      <div style={{ textAlign: 'center', paddingTop: 10, paddingBottom: 5 }}>
        <h1 style={{ color: '#6366f1', fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: '-2px' }}>ResumeTailor.AI</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 32, padding: '0 16px' }}>
          {/* Left: Upload + Form */}
          <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 20, margin: '0 0 0 20px', minHeight: '83.5vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontWeight: 700, fontSize: 28, color: '#8c800f', marginRight: 4 }}>Create Your Tailored Resume</h2>
              <span
                title="Reset form"
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', marginTop: 2 }}
                onClick={resetForm}
              >
                <i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 22, color: '#6366f1' }}></i>
              </span>
            </div>

            <div style={{ width: '100%' }}>
              <ResumeUpload onUpload={() => window.location.reload()} />
            </div>

            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#22292f' }} htmlFor="companyName">
              Company Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                padding: 12,
                fontSize: 16,
                marginBottom: 20,
                background: '#f3f4f6',
                color: '#22292f',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. Google"
            />

            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#22292f' }} htmlFor="role">
              Role <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                padding: 12,
                fontSize: 16,
                marginBottom: 20,
                background: '#f3f4f6',
                color: '#22292f',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. Software Engineer"
            />

            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#22292f' }} htmlFor="jobDescription">
              Job Description <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              required
              rows={8}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                padding: 16,
                fontSize: 16,
                marginBottom: 28,
                background: '#f3f4f6',
                color: '#22292f',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Paste the full job description here..."
            />

            <button
              onClick={handleCraftResume}
              disabled={loading || !jobDescription.trim() || !companyName.trim() || !role.trim()}
              style={{
                width: '100%',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: 18,
                border: 'none',
                borderRadius: 6,
                padding: '14px 0',
                marginTop: 8,
                cursor: loading || !jobDescription.trim() || !companyName.trim() || !role.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !jobDescription.trim() || !companyName.trim() || !role.trim() ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? (crafted ? 'Crafting...' : 'Crafting...') : (crafted ? 'Craft Again' : 'Craft')}
            </button>

            {error && <div style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>{error}</div>}
          </div>

          {/* Center + Actions */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
            {/* Preview */}
            <div style={{ flex: 1, minWidth: 400, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 30, margin: '0 20px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '81vh' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <h3 style={{ fontWeight: 700, fontSize: 24, color: '#6366f1', marginBottom: 0, textAlign: 'center', marginTop: 0, marginRight: 8 }}>Preview</h3>
                {/* {atsLoading && <span style={{ marginLeft: 8, color: '#6366f1', fontSize: 14 }}>Checking...</span>}
                {atsScore !== null && !atsLoading && (
                  <span style={{ marginLeft: 8, color: atsScore >= 70 ? '#22c55e' : '#f59e42', fontWeight: 700, fontSize: 16 }}>
                    ATS Score: {atsScore}
                  </span>
                )}
                {atsError && <span style={{ marginLeft: 8, color: 'red', fontSize: 14 }}>{atsError}</span>} */}
              </div>

              {resumeMarkdown ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' }}>
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: 8,
                    padding: '8px 8px 0 8px',
                    border: '1px solid #e5e7eb',
                    height: 580,
                    width: 500,
                    minWidth: 460,
                    maxWidth: 500,
                    boxShadow: '0 2px 8px #0001',
                    marginBottom: 0,
                    fontSize: 14,
                    fontFamily: 'Calibri, Arial, Times New Roman, sans-serif',
                    color: '#22292f',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                  }}>
                    <div style={{ width: '100%', color: '#22292f', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', flex: 1, wordBreak: 'break-word', overflow: 'hidden' }}>
                      <div style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
                        {renderResumePreview(parseMarkdownSections(resumeMarkdown))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 8,
                  padding: '8px 8px 0 8px',
                  border: '1px solid #e5e7eb',
                  height: 520,
                  width: 460,
                  minWidth: 460,
                  maxWidth: 460,
                  boxShadow: '0 2px 8px #0001',
                  marginBottom: 0,
                  fontSize: 16,
                  fontFamily: 'Calibri, Arial, Times New Roman, sans-serif',
                  color: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}>
                  No preview available
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <button
                  onClick={handleSaveResume}
                  disabled={loading || !resumeMarkdown}
                  style={{
                    background: '#22c55e',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 18,
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px 32px',
                    cursor: loading || !resumeMarkdown ? 'not-allowed' : 'pointer',
                    opacity: loading || !resumeMarkdown ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {loading ? 'Saving...' : 'Save to Local'}
                </button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: 1, background: '#e5e7eb', margin: '0 18px', minHeight: 600, alignSelf: 'stretch', borderRadius: 1 }} />

            {/* Actions Panel */}
            <div style={{ minWidth: 220, maxWidth: 260, background: '#f8fafc', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 28, margin: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, height: 'fit-content' }}>
              <h4 style={{ fontWeight: 700, fontSize: 18, color: '#6366f1', margin: 0, marginBottom: 10, letterSpacing: 0 }}>Actions</h4>
              <button
                onClick={handleCheckAts}
                disabled={atsLoading || !resumeMarkdown || !jobDescription}
                style={{
                  background: '#6366f1',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 24px',
                  cursor: atsLoading || !resumeMarkdown || !jobDescription ? 'not-allowed' : 'pointer',
                  opacity: atsLoading || !resumeMarkdown || !jobDescription ? 0.7 : 1,
                  marginBottom: 8,
                  transition: 'opacity 0.2s',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <i className="fa-solid fa-robot" style={{ fontSize: 16, marginRight: 6 }}></i>
                Check ATS Score
              </button>
              {atsLoading && <span style={{ color: '#6366f1', fontSize: 15, marginTop: 2 }}>Checking...</span>}
              {atsScore !== null && !atsLoading && (
                <span style={{ color: atsScore >= 70 ? '#22c55e' : '#f59e42', fontWeight: 700, fontSize: 18, marginTop: 2 }}>
                  ATS Score: {atsScore}
                </span>
              )}
              {atsError && <span style={{ color: 'red', fontSize: 15, marginTop: 2 }}>{atsError}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
