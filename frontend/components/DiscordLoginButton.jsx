'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function DiscordLoginButton() {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/discord/login`;
  };

  return (
    <button type="button" onClick={handleLogin}>
      Continue with Discord
    </button>
  );
}
