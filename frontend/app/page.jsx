import AuthStatus from '../components/AuthStatus';
import DiscordLoginButton from '../components/DiscordLoginButton';

export default function HomePage() {
  return (
    <main>
      <h1>PatrolGSRP</h1>
      <AuthStatus />
      <DiscordLoginButton />
    </main>
  );
}
