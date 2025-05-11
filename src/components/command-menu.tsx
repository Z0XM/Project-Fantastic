'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAppSelector } from '@/hooks/store';
import { useEffect, useState } from 'react';

/**
 * A command menu component that provides a searchable command palette interface.
 * Can be opened with Cmd/Ctrl + K keyboard shortcut.
 *
 * @component
 * @example
 * ```tsx
 * <CommandMenu />
 * ```
 *
 * @returns A command dialog interface with search input and suggested commands
 *
 * @remarks
 * The component uses a keyboard shortcut listener (Cmd/Ctrl + K) to toggle visibility.
 * Contains a searchable input field and a list of command suggestions.
 * When no results match the search, displays "No results found."
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const aiContext = useAppSelector((state) => state.aiContext.value);

  const aicontextStrings = Object.values(aiContext).map((context) => context.contextString);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
