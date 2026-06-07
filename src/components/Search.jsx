import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Play, Heart, Plus, Loader2, Music, Check, MoreHorizontal } from 'lucide-react';

const musicFallbackSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231e293b'/><circle cx='50' cy='50' r='30' fill='%230f172a'/><circle cx='50' cy='50' r='10' fill='%2338bdf8'/><path d='M50 20 A30 30 0 0 1 80 50' stroke='%2338bdf8' stroke-width='2' fill='none' stroke-dasharray='4,4'/><circle cx='50' cy='50' r='4' fill='%230f172a'/></svg>";

function Search({ playSong, likedSongs, toggleLikeSong, playlists, addSongToPlaylist }) {
  const [query, setQuery] = useState('');
  const [activeLang, setActiveLang] = useState('All');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Dropdowns and UI states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePlaylistSelect, setActivePlaylistSelect] = useState(null); // videoId of active dropdown
  
  const searchInputRef = useRef(null);
  const suggestionRef = useRef(null);

  const languages = ['All', 'Telugu', 'Hindi', 'Tamil', 'English', 'Punjabi', 'Malayalam', 'Kannada'];

  // Handle outside clicks to close suggestion dropdown and playlist menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target) && e.target !== searchInputRef.current) {
        setShowSuggestions(false);
      }
      if (activePlaylistSelect && !e.target.closest('.playlist-dropdown-container')) {
        setActivePlaylistSelect(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activePlaylistSelect]);

  // Fetch Autocomplete Suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.slice(0, 6)); // top 6 suggestions
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search query
  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setShowSuggestions(false);
    
    // Construct search term with active language filter if selected
    let finalQuery = searchQuery.trim();
    if (activeLang !== 'All') {
      // Append language to ensure YouTube fetches the correct version
      finalQuery = `${finalQuery} ${activeLang} song`;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(finalQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Search failed');
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    executeSearch(suggestion);
  };

  const handleLangTagClick = (lang) => {
    setActiveLang(lang);
    // If there is already a query, re-run search with new language tag
    if (query.trim()) {
      // We set activeLang state which is read by executeSearch. Since state updates are async, 
      // we pass the lang explicitly or let it state-update. To avoid timing issues, we run executeSearch directly
      // with a slight delay or pass lang. Let's run it by manually appending or scheduling.
      setTimeout(() => {
        executeSearch(query);
      }, 50);
    }
  };

  const handleAddToPlaylist = (playlistId, song) => {
    addSongToPlaylist(playlistId, song);
    setActivePlaylistSelect(null);
  };

  const handleLikeAndAddToPlaylist = (playlistId, song) => {
    const isLiked = likedSongs.some(s => s.id === song.id);
    if (!isLiked) {
      toggleLikeSong(song);
    }
    addSongToPlaylist(playlistId, song);
    setActivePlaylistSelect(null);
  };

  return (
    <div className="page-container">
      
      {/* Search Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)', marginBottom: '6px' }}>Search</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px' }}>Find songs from any movie, artist, album, or language worldwide.</p>
      </div>

      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          padding: '4px 16px 4px 20px',
          transition: 'all 0.3s'
        }}
        onFocusCapture={(e) => e.currentTarget.style.borderColor = 'var(--vibe-accent)'}
        onBlurCapture={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
        >
          <SearchIcon size={20} color="var(--text-secondary)" style={{ marginRight: '14px' }} />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search movie songs, artists, languages..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              fontFamily: 'var(--font-primary)',
              padding: '12px 0',
              outline: 'none'
            }}
          />
          {query.trim() && (
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '8px 20px', fontSize: '13.5px', boxShadow: 'none' }}
            >
              Search
            </button>
          )}
        </div>

        {/* Suggestion Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionRef}
            className="glass-panel" 
            style={{
              position: 'absolute',
              top: '64px',
              left: '10px',
              right: '10px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
              padding: '6px'
            }}
          >
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14.5px',
                  fontFamily: 'var(--font-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <SearchIcon size={16} color="var(--text-muted)" />
                {sug}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Language filter tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {languages.map(lang => {
          const isActive = activeLang === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleLangTagClick(lang)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: isActive ? 'var(--vibe-accent)' : 'rgba(255,255,255,0.06)',
                backgroundColor: isActive ? 'var(--vibe-accent)' : 'rgba(255,255,255,0.02)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                fontSize: '13.5px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 0 10px var(--vibe-glow-1)' : 'none'
              }}
              onMouseOver={(e) => {
                if(!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseOut={(e) => {
                if(!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* Search Results */}
      <div style={{ marginTop: '10px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <Loader2 size={36} className="spinning-vinyl" style={{ color: 'var(--vibe-accent)' }} />
            <span>Searching database...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="glass-panel" style={{ borderRadius: '20px', padding: '16px 20px', overflow: 'hidden' }}>
            {/* Tracks List Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {results.map((song, idx) => {
                const isLiked = likedSongs.some(s => s.id === song.id);
                return (
                  <div
                    key={song.id}
                    className="song-list-item-row"
                    onClick={() => playSong(song, results)}
                  >
                    {/* Index */}
                    <span className="hide-on-mobile" style={{ width: '30px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>
                      {idx + 1}
                    </span>

                    {/* Image and Metadata */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0, paddingRight: '20px' }}>
                      <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                        <img 
                          src={song.thumbnail} 
                          alt={song.title} 
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                          style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{
                          fontSize: '14.5px',
                          fontWeight: '600',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={song.title}>
                          {song.title}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {song.channelName} <span className="show-on-mobile">• {song.duration}</span>
                        </span>
                      </div>
                    </div>

                    {/* View statistics */}
                    <span className="hide-on-mobile" style={{ width: '120px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {song.views || ''}
                    </span>

                    {/* Duration */}
                    <span className="hide-on-mobile" style={{ width: '60px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'right', marginRight: '16px' }}>
                      {song.duration}
                    </span>

                    {/* Controls (Unified Options Menu) */}
                    <div className="playlist-dropdown-container" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setActivePlaylistSelect(activePlaylistSelect === song.id ? null : song.id)}
                        className="btn-icon"
                        style={{ padding: '6px' }}
                        title="Options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activePlaylistSelect === song.id && (
                        <div style={{
                          position: 'absolute',
                          top: '32px',
                          right: '0',
                          borderRadius: '12px',
                          padding: '6px',
                          minWidth: '180px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          backgroundColor: '#12131a',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                          {/* 1. Toggle Like */}
                          <button
                            onClick={() => {
                              toggleLikeSong(song);
                              setActivePlaylistSelect(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              color: isLiked ? 'var(--vibe-accent)' : 'var(--text-secondary)',
                              fontFamily: 'var(--font-primary)',
                              fontSize: '13px',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Heart size={14} fill={isLiked ? 'var(--vibe-accent)' : 'none'} />
                            <span>{isLiked ? 'Unlike Song' : 'Like Song'}</span>
                          </button>

                          {/* Divider */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                          {/* 2. Add to Playlist List */}
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Add to Playlist</span>
                          {playlists.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No custom playlists</span>
                          ) : (
                            playlists.map(p => {
                              const songAlreadyAdded = p.songs.some(s => s.id === song.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleAddToPlaylist(p.id, song)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '13px',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{p.name}</span>
                                  {songAlreadyAdded && <Check size={12} color="var(--vibe-accent)" />}
                                </button>
                              );
                            })
                          )}

                          {/* Divider */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                          {/* 3. Like & Add to Playlist List */}
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Like & Add to Playlist</span>
                          {playlists.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No custom playlists</span>
                          ) : (
                            playlists.map(p => {
                              const songAlreadyAdded = p.songs.some(s => s.id === song.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleLikeAndAddToPlaylist(p.id, song)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '13px',
                                    textAlign: 'left'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{p.name}</span>
                                  {songAlreadyAdded && <Check size={12} color="var(--vibe-accent)" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ) : query.trim() ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Music size={32} />
            <span>No results found. Try adjusting your query or tag filter.</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SearchIcon size={32} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Ready to listen?</h4>
              <p style={{ fontSize: '13.5px' }}>Type song keywords or select language tags above to scan the movie database.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Search;
