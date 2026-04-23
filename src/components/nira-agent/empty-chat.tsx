import React from 'react';
import { CallListBlank } from '../call-logs/call-list-blank';

export const EmptyChat = () => {
    return (
        <div className="flex w-full flex-col items-center h-full justify-center gap-4">

            <CallListBlank
                title="No messages yet"
                description="Once you start a conversation, your messages will appear here."
            />
        </div>
    );
};