export function calculateProcessingFeeCents(offerCents: number): number {
  // Approximate card processing: 3.2% + $0.30
  return Math.ceil(offerCents * 0.032 + 30);
}
