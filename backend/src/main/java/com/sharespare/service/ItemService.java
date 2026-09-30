package com.sharespare.service;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.UpdateItemRequest;
import com.sharespare.dto.response.ItemAvailabilityDto;
import com.sharespare.dto.response.ItemDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ItemService {

    ItemDto createItem(String userEmail, CreateItemRequest createItemRequest);

    ItemDto getItemById(Long itemId);

    Page<ItemDto> getAllItems(String category, String location, String search, Pageable pageable);

    List<ItemDto> getItemsByLender(String userEmail);

    ItemDto updateItem(String userEmail, Long itemId, UpdateItemRequest updateItemRequest);

    void deleteItem(String userEmail, Long itemId);

    ItemAvailabilityDto checkAvailability(Long itemId, LocalDate startDate, LocalDate endDate);
}
