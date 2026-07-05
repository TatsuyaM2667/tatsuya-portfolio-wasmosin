import React, { useEffect, useState } from "react";

type SpotifyArtist = { name: string };
type SpotifyAlbumImage = { url: string };
type SpotifyAlbum = { images?: SpotifyAlbumImage[] };

type SpotifyTrack = {
  name: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  duration_ms?: number;
  external_urls?: { spotify?: string };
};

type SpotifyNowPlaying = {
  connected: boolean;
  is_playing?: boolean;
  item?: SpotifyTrack;
  progress_ms?: number;
};

const POLL_MS = 30000; // 30 seconds (reduced frequency to avoid extra API/KV usage)

const NowPlaying: React.FC = () => {
  const [data, setData] = useState<SpotifyNowPlaying | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastItem, setLastItem] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchNow = async () => {
      try {
        const res = await fetch("/api/now-playing");
        if (!mounted) return;
        if (!res.ok) {
          const txt = await res.text();
          setError(txt || "Error");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
        if (json && json.item) setLastItem(json.item);
        setLoading(false);
      } catch (e: unknown) {
        console.error(e);
        if (!mounted) return;
        const errMsg =
          typeof e === "string"
            ? e
            : e instanceof Error
              ? e.message
              : JSON.stringify(e);
        setError(errMsg);
        setLoading(false);
      }
    };

    fetchNow();
    const id = setInterval(fetchNow, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const renderContent = () => {
    // 非表示条件：読み込み中、エラー、データ無し、もしくは接続されていない
    if (loading || error || !data || !data.connected) return null;

    // At this point we have data and it's connected

    const item = data.item || lastItem;
    if (!data.is_playing || !item) {
      if (!item) {
        return (
          <div className="now-playing">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Spotify</div>
              <div style={{ color: "var(--accent)" }}>Not playing</div>
            </div>
          </div>
        );
      }
      // Show last played
      const artists = ((item.artists || []) as SpotifyArtist[])
        .map((a) => a.name)
        .join(", ");
      const img = item.album?.images?.[0]?.url;
      return (
        <div className="now-playing">
          {img && <img src={img} alt="album" />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div style={{ color: "var(--accent)" }}>{artists}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Not currently playing
            </div>
          </div>
        </div>
      );
    }

    // is playing
    const artists = ((item.artists || []) as SpotifyArtist[])
      .map((a) => a.name)
      .join(", ");
    const img = item.album?.images?.[0]?.url;
    const progress = data.progress_ms ?? 0;
    const duration = item.duration_ms ?? 1;
    const percent = Math.min(100, Math.round((progress / duration) * 100));

    return (
      <div className="now-playing">
        {img && <img src={img} alt="album" />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{item.name}</div>
          <div style={{ color: "var(--accent)" }}>{artists}</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <a
          className="connect"
          href={item.external_urls?.spotify || "/"}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>
      </div>
    );
  };

  return renderContent();
};

export default NowPlaying;
