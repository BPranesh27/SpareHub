package com.sharespare.service;

import com.sharespare.dto.response.AnalyticsSummaryDto;
import com.sharespare.dto.response.ItemPerformanceDto;
import com.sharespare.dto.response.RevenueTrendDto;

import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    AnalyticsSummaryDto getSummary(String lenderEmail);

    List<ItemPerformanceDto> getItemPerformance(String lenderEmail);

    List<RevenueTrendDto> getRevenueTrend(String lenderEmail);

    Map<String, List<ItemPerformanceDto>> getTopItems(String lenderEmail);
}
