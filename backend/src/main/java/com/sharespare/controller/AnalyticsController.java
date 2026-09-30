package com.sharespare.controller;

import com.sharespare.dto.response.AnalyticsSummaryDto;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.ItemPerformanceDto;
import com.sharespare.dto.response.RevenueTrendDto;
import com.sharespare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        AnalyticsSummaryDto summary = analyticsService.getSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lender analytics summary retrieved successfully", summary));
    }

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<ItemPerformanceDto>>> getItemPerformance(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ItemPerformanceDto> items = analyticsService.getItemPerformance(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Item performance metrics retrieved successfully", items));
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<ApiResponse<List<RevenueTrendDto>>> getRevenueTrend(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<RevenueTrendDto> trend = analyticsService.getRevenueTrend(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Revenue trend data retrieved successfully", trend));
    }

    @GetMapping("/top-items")
    public ResponseEntity<ApiResponse<Map<String, List<ItemPerformanceDto>>>> getTopItems(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, List<ItemPerformanceDto>> topItems = analyticsService.getTopItems(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Top items analytics retrieved successfully", topItems));
    }
}
