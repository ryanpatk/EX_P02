import AppHeader from './AppHeader';
import { EmptyState, FrostedStack } from './ui';
import { useSession } from '../context/SessionContext';

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  hint: string;
}

const ModulePlaceholder = ({ title, subtitle, hint }: ModulePlaceholderProps) => {
  const { session } = useSession();

  return (
    <div className="bookmark-dashboard">
      <AppHeader user={session?.user ?? null} />
      <div className="memex-module-main">
        <FrostedStack className="memex-module-stack">
          <EmptyState title={title} subtitle={subtitle}>
            <p className="memex-module-hint">{hint}</p>
          </EmptyState>
        </FrostedStack>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
