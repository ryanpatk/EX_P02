import { useSession } from "../context/SessionContext";
import HomePage from "../pages/HomePage";
import JournalPage from "../pages/JournalPage";
import MemexShell from "../components/MemexShell";

/** `/`: the Journal for a signed-in user (memex's home), the landing page otherwise. */
const RootRoute = () => {
  const { session, authHydrated } = useSession();
  if (!authHydrated) return null;
  if (!session) return <HomePage />;
  return (
    <MemexShell>
      <JournalPage />
    </MemexShell>
  );
};

export default RootRoute;
