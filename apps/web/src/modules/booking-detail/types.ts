export type BookingSegment = {
  readonly id: string;
  readonly origin: string;
  readonly destination: string;
  readonly fareFamily: string;
};

export type BookingDetail = {
  readonly id: string;
  readonly travelerName: string;
  readonly segments: readonly BookingSegment[];
};
