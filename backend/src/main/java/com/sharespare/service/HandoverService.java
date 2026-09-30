package com.sharespare.service;

import com.sharespare.dto.request.VerifyHandoverRequest;
import com.sharespare.dto.response.HandoverResponseDto;

public interface HandoverService {

    HandoverResponseDto getOrCreateHandover(String userEmail, Long bookingId);

    HandoverResponseDto verifyHandover(String userEmail, VerifyHandoverRequest request);

    HandoverResponseDto getHandoverStatus(String userEmail, Long bookingId);
}
