'use client';

import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';
import ProviderContent from '@/redux/ProviderContent';

type AntdContainer = Element & { _reactRoot?: ReturnType<typeof createRoot> };

unstableSetRender((node, container) => {
  const host = container as AntdContainer;
  host._reactRoot ||= createRoot(host);
  const root = host._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProviderContent>
      {children}
    </ProviderContent>
  );
}
