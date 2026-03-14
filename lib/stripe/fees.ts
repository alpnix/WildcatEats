export function calculateProcessingFeeCents(offerCents: number): number {
  // Stripe fees: ~3.2% + $0.30
  return Math.ceil(offerCents * 0.032 + 30);
}
