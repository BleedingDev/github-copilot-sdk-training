<?php

declare(strict_types=1);

namespace SampleBookingApp\BookingDetail;

final class FareFamilyWarningResolver
{
    /**
     * @param array<int, array{id: string, fareFamily: string}> $segments
     * @return array<string, array<int, string>>
     */
    public function warningCodesBySegment(array $segments): array
    {
        $fareFamilies = array_unique(array_map(
            static fn (array $segment): string => $segment['fareFamily'],
            $segments,
        ));

        if (count($fareFamilies) <= 1) {
            return [];
        }

        $warnings = [];
        foreach ($segments as $segment) {
            $warnings[$segment['id']] = ['mixed-fare-family'];
        }

        return $warnings;
    }
}
