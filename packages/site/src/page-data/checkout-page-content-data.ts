/**
 * Représentation JSON du contenu affiché sur `/checkout` (page checkout).
 * Utilisée comme `contentData` Request Network pour la démo mock storage.
 */
export const CHECKOUT_PAGE_CONTENT_DATA = {
  orderSummary: {
    sectionTitle: 'Récapitulatif',
    orderReference: 'REQ-2026-1847',
    lineItems: [
      {
        id: 'line-tshirt',
        name: 'T-shirt Request Network',
        meta: 'Taille M · Blanc',
        quantity: 1,
        lineTotal: '24,90 €',
      },
      {
        id: 'line-stickers',
        name: 'Autocollants branding',
        meta: 'Lot de 5',
        quantity: 2,
        lineTotal: '9,80 €',
      },
      {
        id: 'line-shipping',
        name: 'Frais de port',
        meta: 'Colissimo',
        quantityLabel: '—',
        lineTotal: '4,50 €',
      },
    ],
    totals: {
      subtotal: '44,60 €',
      vat: { label: 'TVA (20 %)', amount: '8,92 €' },
      totalTtc: '53,52 €',
    },
  },
} as const;

export type CheckoutPageContentData = typeof CHECKOUT_PAGE_CONTENT_DATA;
