import { createContext, useContext, useState, type ReactNode } from "react";

type PageActionsContextType = {
  pageAction: ReactNode | null;
  setPageAction: (node: ReactNode | null) => void;
};

const PageActionsContext = createContext<PageActionsContextType>({
  pageAction: null,
  setPageAction: () => {},
});

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [pageAction, setPageAction] = useState<ReactNode | null>(null);
  return (
    <PageActionsContext.Provider value={{ pageAction, setPageAction }}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  return useContext(PageActionsContext);
}
