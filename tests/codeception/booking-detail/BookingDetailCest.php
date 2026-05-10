<?php

declare(strict_types=1);

final class BookingDetailCest
{
    public function bookingDetailContainsSegments(ApiTester $I): void
    {
        $I->sendGet('/booking/DEMO-1942');
        $I->seeResponseCodeIs(200);
        $I->seeResponseContainsJson([
            'id' => 'DEMO-1942',
        ]);
    }
}
