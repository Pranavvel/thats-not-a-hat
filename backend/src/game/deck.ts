import type { ArrowDirection, Card } from '../types';

// Placeholder item names; in a full implementation, populate with the
// official 110-card list and arrow directions.
const ITEM_NAMES: { itemName: string; arrowDirection: ArrowDirection }[] = [
  { itemName: 'Hat', arrowDirection: 'left' },
  { itemName: 'Mug', arrowDirection: 'right' },
  { itemName: 'Book', arrowDirection: 'left' },
  { itemName: 'Plant', arrowDirection: 'right' },
  { itemName: 'Socks', arrowDirection: 'left' },
  { itemName: 'Lamp', arrowDirection: 'right' },
];

const TOTAL_CARDS = 110;

function shuffleInPlace<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i] as T;
    array[i] = array[j] as T;
    array[j] = tmp;
  }
}

export function generateDeck(): Card[] {
  const cards: Card[] = [];
  let idCounter = 0;

  while (cards.length < TOTAL_CARDS) {
    for (const template of ITEM_NAMES) {
      if (cards.length >= TOTAL_CARDS) break;
      cards.push({
        id: `card_${idCounter.toString(10)}`,
        itemName: template.itemName,
        arrowDirection: template.arrowDirection,
      });
      idCounter += 1;
    }
  }

  shuffleInPlace(cards);
  return cards;
}

