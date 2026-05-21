'use client';
import React from 'react';

export default function AnalyticsDashboard({ stats, loading }) {
  if (loading) {
    return (
      <div style={{
        backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px',
        padding: '1.8rem', marginBottom: '2rem', textAlign: 'center', color: '#666',
        fontSize: '0.95rem', fontFamily: 'monospace'
      }}>
        ⚡ Initializing semantic metric core...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(163, 112, 247, 0.05); }
          50% { box-shadow: 0 0 25px rgba(163, 112, 247, 0.15); }
          100% { box-shadow: 0 0 15px rgba(163, 112, 247, 0.05); }
        }
      `}</style>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={{
          flex: 1, backgroundColor: '#111', border: '1px solid #222', 
          borderRadius: '14px', padding: '1.4rem', textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'border-color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0070f3'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
        >
          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL VAULT ENTRIES</span>
          <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '2.2rem', fontWeight: '800', color: '#0070f3' }}>{stats.totalCount}</h2>
        </div>
        
        <div style={{
          flex: 1, backgroundColor: '#111', border: '1px solid #222', 
          borderRadius: '14px', padding: '1.4rem', textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'border-color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff66'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
        >
          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold', letterSpacing: '1px' }}>ADDED THIS WEEK</span>
          <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '2.2rem', fontWeight: '800', color: '#00ff66' }}>{stats.recentCount}</h2>
        </div>
      </div>

      {/* AI Summary Card with Active Pulse Glow */}
      <div style={{
        backgroundColor: '#111', 
        border: '1px solid #2b1c40', 
        borderRadius: '14px',
        padding: '1.5rem', 
        textAlign: 'left', 
        backgroundImage: 'linear-gradient(135deg, #111 0%, #150f24 100%)',
        animation: 'pulseGlow 4s infinite ease-in-out',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <h4 style={{ margin: '0 0 0.6rem 0', color: '#a370f7', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '600' }}>
          ✨ AI Brain Insights
        </h4>
        <p style={{ margin: 0, color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>
          "{stats.aiSummary}"
        </p>
      </div>
    </div>
  );
}