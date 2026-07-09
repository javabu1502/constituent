'use client';

import { SocialShare } from '@/components/ui/SocialShare';

interface ShareActionsProps {
  shareId: string;
  repName: string;
  issue: string;
}

export function ShareActions({ shareId, repName, issue }: ShareActionsProps) {
  return (
    <div className="mt-6">
      <SocialShare
        url={`https://www.mydemocracy.app/share/${shareId}`}
        text={`I just contacted ${repName} about ${issue}. Make your voice heard too!`}
        title="I contacted my rep"
        prompt="Spread the word"
      />
    </div>
  );
}
