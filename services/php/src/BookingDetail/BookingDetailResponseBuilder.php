<?php

declare(strict_types=1);

namespace SampleBookingApp\BookingDetail;

final class BookingDetailResponseBuilder
{
    /**
     * @param array<int, array{id: string, origin: string, destination: string, fareFamily: string}> $segments
     * @return array{id: string, travelerName: string, segments: array<int, array<string, string>>}
     */
    public function build(array $booking, array $segments): array
    {
        return [
            'id' => (string) $booking['id'],
            'travelerName' => (string) $booking['travelerName'],
            'segments' => array_map(
                static fn (array $segment): array => [
                    'id' => $segment['id'],
                    'origin' => $segment['origin'],
                    'destination' => $segment['destination'],
                    'fareFamily' => $segment['fareFamily'],
                ],
                $segments,
            ),
        ];
    }
}
