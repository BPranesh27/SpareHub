package com.sharespare.service;

import com.sharespare.dto.request.CreateDamageReportRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.DamageReportResponseDto;
import com.sharespare.dto.response.ReturnSummaryResponseDto;

public interface ReturnService {

    BookingDto requestReturn(String email, Long bookingId);

    DamageReportResponseDto submitDamageInspection(String email, Long bookingId, CreateDamageReportRequest request);

    BookingDto completeReturn(String email, Long bookingId);

    DamageReportResponseDto getDamageReport(String email, Long bookingId);

    ReturnSummaryResponseDto getReturnSummary(String email, Long bookingId);
}
