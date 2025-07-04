import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@civicsense/design-tokens';

const queryClient = new QueryClient();

function App() {
  const ctx = require.context('./app');
  
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ThemeProvider>
          <ExpoRoot context={ctx} />
        </ThemeProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

registerRootComponent(App); 