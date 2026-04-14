import type { GlossaryTerm } from '../types';

// Glossary terms are revealed progressively as students complete stops.
// Add terms here as you build each stop's content.
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Stop 1
  {
    id: 'globalization',
    term: 'Globalization',
    definition:
      'The process by which the world\'s economies, cultures, and populations have become increasingly integrated through cross-border trade, investment, and information flow.',
    unlockedAfterStop: 1,
  },
  {
    id: 'sovereignty',
    term: 'Sovereignty',
    definition:
      'The full right and power of a governing body to govern itself without outside interference.',
    unlockedAfterStop: 1,
  },
  // Add more terms here as stops are built
];
