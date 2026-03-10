'use client';

import { useState } from 'react';
import { FollowUpModal } from './FollowUpModal';

interface FollowUpButtonProps {
  messageId: string;
  officialName: string;
  issueArea: string;
  deliveryMethod: string;
  senderName: string;
}

export function FollowUpButton({
  messageId,
  officialName,
  issueArea,
  deliveryMethod,
  senderName,
}: FollowUpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
      >
        Send Follow-Up
      </button>
      {isOpen && (
        <FollowUpModal
          messageId={messageId}
          officialName={officialName}
          issueArea={issueArea}
          deliveryMethod={deliveryMethod}
          senderName={senderName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
