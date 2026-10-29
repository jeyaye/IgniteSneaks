import { useAuth } from "../context/useAuth";

function Home() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <main>
      <h1>Ignite Sneaks</h1>
      <p>FUEL YOUR NEXT MOVE.</p>

      <h2>Welcome, {user?.username}!</h2>

      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}

export default Home;