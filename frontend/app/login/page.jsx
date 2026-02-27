import DiscordLoginButton from '../../components/DiscordLoginButton';
import AuthStatus from '../../components/AuthStatus';

export default function LoginPage({ searchParams }) {
  const error = searchParams?.error;

  return (
    <main>
      <h1>Login</h1>
      {error ? <p>Login failed: {error}</p> : null}
      <DiscordLoginButton />
      <AuthStatus />
    </main>
  );
}
