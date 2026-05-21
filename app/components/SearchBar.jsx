'use client';
import React, { useState } from 'react';

export default function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onClear(); // This triggers our fetchMemories function to reload the full list!
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // If the user manually backspaces and deletes everything, restore recent memories automatically!
            if (e.target.value === '') {
              onClear();
            }
          }}
          placeholder="Search your memories using pure AI logic..." 
          style={{
            flex: 1, padding: '0.8rem 1.2rem', borderRadius: '8px',
            border: '1px solid #333', backgroundColor: '#111',
            color: '#fff', fontSize: '1rem', outline: 'none'
          }}
        />
        <button type="submit" style={{
          padding: '0.8rem 1.5rem', backgroundColor: '#fff', color: '#000',
          border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
        }}>
          Search
        </button>
        
        {/* If there is text in the search bar, show a clear button */}
        {query && (
          <button type="button" onClick={handleClear} style={{
            padding: '0.8rem 1rem', backgroundColor: '#222', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}>
            Clear
          </button>
        )}
      </form>
    </div>
  );
}