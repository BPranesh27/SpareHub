package com.sharespare.controller;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.UpdateItemRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.ItemAvailabilityDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping
    public ResponseEntity<ApiResponse<ItemDto>> createItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateItemRequest createItemRequest) {
        ItemDto createdItem = itemService.createItem(userDetails.getUsername(), createItemRequest);
        return new ResponseEntity<>(
                ApiResponse.success("Item created successfully!", createdItem),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ItemDto>>> getAllItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ItemDto> items = itemService.getAllItems(category, location, search, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Items retrieved successfully", items)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemDto>> getItemById(@PathVariable Long id) {
        ItemDto item = itemService.getItemById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Item details retrieved", item)
        );
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<ItemAvailabilityDto>> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        ItemAvailabilityDto availability = itemService.checkAvailability(id, startDate, endDate);
        return ResponseEntity.ok(
                ApiResponse.success("Availability calculation completed", availability)
        );
    }

    @GetMapping("/my-items")
    public ResponseEntity<ApiResponse<List<ItemDto>>> getMyItems(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ItemDto> myItems = itemService.getItemsByLender(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("User listed items retrieved", myItems)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemDto>> updateItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateItemRequest updateItemRequest) {
        ItemDto updatedItem = itemService.updateItem(userDetails.getUsername(), id, updateItemRequest);
        return ResponseEntity.ok(
                ApiResponse.success("Item updated successfully", updatedItem)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        itemService.deleteItem(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Item deleted successfully")
        );
    }
}
