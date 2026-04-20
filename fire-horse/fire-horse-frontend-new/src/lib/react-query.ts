import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from '@/components/ui/toast/use-toast';
import type { ReactNode } from 'react';

// Configuração padrão para as queries
const defaultQueryOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  },
};

// Tratamento de erros global para queries
const queryCache = new QueryCache({
  onError: (error: any, query) => {
    // Ignorar erros para queries que têm a opção useErrorBoundary ativada
    if (query.meta?.errorMessage) {
      toast({
        title: 'Erro',
        description: query.meta.errorMessage as string,
        variant: 'destructive',
      });
    }
  },
});

// Tratamento de erros global para mutations
const mutationCache = new MutationCache({
  onError: (error: any, _variables, _context, mutation) => {
    // Se a mutation tiver um meta com errorMessage, exibe o toast
    if (mutation.meta?.errorMessage) {
      toast({
        title: 'Erro',
        description: mutation.meta.errorMessage as string,
        variant: 'destructive',
      });
    }
  },
  onSuccess: (_data, _variables, _context, mutation) => {
    // Se a mutation tiver um meta com successMessage, exibe o toast
    if (mutation.meta?.successMessage) {
      toast({
        title: 'Sucesso',
        description: mutation.meta.successMessage as string,
        variant: 'default',
      });
    }
  },
});

// Criação do cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
  queryCache,
  mutationCache,
});

// Provedor do React Query
interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

export { queryClient };

// Hooks personalizados para facilitar o uso do React Query
export * from '@tanstack/react-query';

// Exporta os tipos
import type {
  QueryKey,
  QueryFunction,
  UseQueryOptions,
  UseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';

export type {
  QueryKey,
  QueryFunction,
  UseQueryOptions,
  UseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
};
