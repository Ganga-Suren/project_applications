// Utility: Parse markdown into structured sections
function parseMarkdownSections(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let preface = [];

  lines.forEach(line => {
    // Remove asterisks from headings/subheadings (e.g., '**PROFESSIONAL SUMMARY**' → 'PROFESSIONAL SUMMARY')
    if (line.startsWith('## ')) {
      let header = line.replace('## ', '').trim();
      if (header.startsWith('**') && header.endsWith('**')) header = header.slice(2, -2).trim();
      if (currentSection) sections.push(currentSection);
      else if (preface.length > 0) {
        // Treat pre-header text as 'About' section
        sections.push({ subheaders: [], bullets: [], paragraphs: preface });
        preface = [];
      }
      currentSection = { header, subheaders: [], bullets: [], paragraphs: [] };
    } else if (line.startsWith('### ')) {
      let sub = line.replace('### ', '').trim();
      if (sub.startsWith('**') && sub.endsWith('**')) sub = sub.slice(2, -2).trim();
      if (currentSection) currentSection.subheaders.push(sub);
    } else if (line.startsWith('- ')) {
      if (currentSection) currentSection.bullets.push(line.replace('- ', '').trim());
    } else if (line.trim() !== '') {
      // Add plain text lines as paragraphs
      if (currentSection) currentSection.paragraphs.push(line.trim());
      else preface.push(line.trim());
    }
  });
  if (currentSection) sections.push(currentSection);
  else if (preface.length > 0) sections.push({ header: 'About', subheaders: [], bullets: [], paragraphs: preface });
  return sections;
}

// Utility: Render professional resume preview
function renderResumePreview(sections) {
  return (
    <div>
      {sections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          {/* Section Header: bold, 12pt, compact spacing */}
          <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 2, marginTop: 2, letterSpacing: 0 }}>{section.header}</div>
          {section.subheaders.map((sub, i) => (
            <div key={i} style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 1, marginTop: 1 }}>{sub}</div>
          ))}
          {section.paragraphs && section.paragraphs.length > 0 && (
            <div style={{ marginLeft: 0, marginBottom: 2 }}>
              {section.paragraphs.map((para, k) => (
                <div key={k} style={{ fontSize: 10, marginBottom: 1 }}>{para}</div>
              ))}
            </div>
          )}
          {section.bullets.length > 0 && (
            <ul style={{ marginLeft: 18, marginBottom: 0, paddingLeft: 0 }}>
              {section.bullets.map((bullet, j) => (
                <li key={j} style={{ marginBottom: 1, fontSize: 10, paddingLeft: 0 }}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

import React, { useState } from 'react';
// FontAwesome CDN for icons
// Add this to your public/index.html if not already present:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const App = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  // Removed unused resumePath state
  const [error, setError] = useState('');
  const [crafted, setCrafted] = useState(false);

  // Removed unused pageIdx state

  const handleCraftResume = async () => {
    setLoading(true);
    setError('');
    setResumeMarkdown('');
    // Removed unused resumePath assignment
    setCrafted(false);
    try {
      // Save JD first
      await axios.post('http://localhost:3000/api/save-jd', {
        jobDescription,
        companyName,
        role,
      });
      // Generate resume
      const { data } = await axios.post('http://localhost:3000/api/generate-resume', {
        jobDescription,
        companyName,
        role,
      });
      setResumeMarkdown(data.resumeMarkdown);
      setCrafted(true);
    } catch (err) {
      console.error(err);
      setError('Failed to craft resume.');
    }
    setLoading(false);
  };
  

  const handleSaveResume = async () => {
    setLoading(true);
    setError('');
    // Removed unused resumePath assignment
    try {
      await axios.post('http://localhost:3000/api/save-resume', {
        companyName,
        role,
        resumeMarkdown,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to save resume.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f4f5f7', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #f4f5f7;
        }
      `}</style>
      <div style={{ textAlign: 'center', paddingTop: 10, paddingBottom: 5 }}>
        <h1 style={{ color: '#6366f1', fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: '-2px' }}>ResumeTailor.AI</h1>
        <div style={{ color: '#6b7280', fontSize: 10, marginTop: 8, marginBottom: 12 }}>
          Transform your master resume into a job-winning application.
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 32 }}>
            {/* Left: Input Form */}
            <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 40, margin: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8, color: '#8c800f', marginRight: 4 }}>Create Your Tailored Resume</h2>
                <span
                  title="Reset form"
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', marginTop: 2 }}
                  onClick={() => {
                    setCompanyName('');
                    setRole('');
                    setJobDescription('');
                    setResumeMarkdown('');
                    setError('');
                    setCrafted(false);
                    // Removed unused pageIdx assignment
                  }}
                >
                  <i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 22, color: '#6366f1' }}></i>
                </span>
              </div>
              <div style={{ color: '#6b7280', marginBottom: 28 }}>
                Enter the job details below to let our AI craft a perfectly tailored resume for you.
              </div>
              <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#22292f'}} htmlFor="companyName">
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

            {/* Right: Preview and Actions */}
            <div style={{ flex: 1, minWidth: 400, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 32, margin: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: 24, color: '#6366f1', marginBottom: 8, textAlign: 'center', marginTop: 0 }}>Preview</h3>
              {resumeMarkdown ? (() => {
                // Parse markdown and render professional preview
                const sections = parseMarkdownSections(resumeMarkdown);
                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
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
                            {renderResumePreview(sections)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                      <button
                        onClick={handleSaveResume}
                        disabled={loading}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 18,
                          border: 'none',
                          borderRadius: 6,
                          padding: '12px 32px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {loading ? 'Saving...' : 'Save to Local'}
                      </button>
                    </div>
                  </>
                );
              })() : (
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
            </div>
          </div>
      </div>
    </div>
  );
};

export default App;
