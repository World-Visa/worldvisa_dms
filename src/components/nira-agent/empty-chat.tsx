import React from 'react';
import { Persona } from '../ui/ai-elements/persona';

export const EmptyChat = () => {
    return (
        <div className="flex w-full flex-col items-center h-full justify-center gap-4">
            <Persona className="size-32" state="idle" variant="mana" />
        </div>
    );
};