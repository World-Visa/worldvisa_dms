'use client';

import { RiSparklingFill } from 'react-icons/ri';
import { useLayoutStore } from '@/store/layoutStore';
import { cn } from '@/lib/utils';
import { Button } from '../primitives/button';
import { AiSparkels } from '../../icons/ai-sparkels';

export function AskNiraButton() {
  const niraPanelOpen = useLayoutStore((s) => s.niraPanelOpen);
  const openNiraPanel = useLayoutStore((s) => s.openNiraPanel);
  const closeNiraPanel = useLayoutStore((s) => s.closeNiraPanel);

  const handleClick = () => {
    if (niraPanelOpen) {
      closeNiraPanel();
    } else {
      openNiraPanel();
    }
  };

  return (
    <Button
      onClick={handleClick}
      aria-label="Ask Nira AI"
      aria-pressed={niraPanelOpen}
      leadingIcon={AiSparkels}
      size="sm"
      variant="secondary"
      mode="ghost"
      className='text-sm text-text-sub hover:text-text-strong'
    >
      <span className="leading-none">Ask AI</span>
    </Button>
  );
}
