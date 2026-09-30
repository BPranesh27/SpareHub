package com.sharespare.service.impl;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.UpdateItemRequest;
import com.sharespare.dto.response.ItemAvailabilityDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.ItemImageDto;
import com.sharespare.entity.Item;
import com.sharespare.entity.ItemImage;
import com.sharespare.entity.User;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.ReviewRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional
    public ItemDto createItem(String userEmail, CreateItemRequest createItemRequest) {
        User lender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Item item = Item.builder()
                .lender(lender)
                .name(createItemRequest.getName().trim())
                .category(createItemRequest.getCategory().trim())
                .description(createItemRequest.getDescription().trim())
                .pricePerDay(createItemRequest.getPricePerDay())
                .securityDeposit(createItemRequest.getSecurityDeposit())
                .location(createItemRequest.getLocation().trim())
                .availabilityStatus("AVAILABLE")
                .images(new ArrayList<>())
                .build();

        if (createItemRequest.getImageUrls() != null && !createItemRequest.getImageUrls().isEmpty()) {
            boolean isFirst = true;
            for (String url : createItemRequest.getImageUrls()) {
                if (url != null && !url.trim().isEmpty()) {
                    ItemImage image = ItemImage.builder()
                            .imageUrl(url.trim())
                            .isPrimary(isFirst)
                            .build();
                    item.addImage(image);
                    isFirst = false;
                }
            }
        }

        Item savedItem = itemRepository.save(item);
        return mapToDto(savedItem);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemDto getItemById(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));
        return mapToDto(item);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ItemDto> getAllItems(String category, String location, String search, Pageable pageable) {
        String catFilter = (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category.trim())) 
                ? category.trim() : null;
        String locFilter = (location != null && !location.trim().isEmpty()) ? location.trim() : null;
        String searchFilter = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Item> itemPage = itemRepository.searchItems(catFilter, locFilter, searchFilter, pageable);
        return itemPage.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemDto> getItemsByLender(String userEmail) {
        User lender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        List<Item> items = itemRepository.findByLenderOrderByIdDesc(lender);
        return items.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ItemDto updateItem(String userEmail, Long itemId, UpdateItemRequest updateItemRequest) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        if (!item.getLender().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Unauthorized: You can only edit items that you own.");
        }

        item.setName(updateItemRequest.getName().trim());
        item.setCategory(updateItemRequest.getCategory().trim());
        item.setDescription(updateItemRequest.getDescription().trim());
        item.setPricePerDay(updateItemRequest.getPricePerDay());
        item.setSecurityDeposit(updateItemRequest.getSecurityDeposit());
        item.setLocation(updateItemRequest.getLocation().trim());

        if (updateItemRequest.getAvailabilityStatus() != null) {
            item.setAvailabilityStatus(updateItemRequest.getAvailabilityStatus());
        }

        if (updateItemRequest.getImageUrls() != null && !updateItemRequest.getImageUrls().isEmpty()) {
            item.getImages().clear();
            boolean isFirst = true;
            for (String url : updateItemRequest.getImageUrls()) {
                if (url != null && !url.trim().isEmpty()) {
                    ItemImage image = ItemImage.builder()
                            .imageUrl(url.trim())
                            .isPrimary(isFirst)
                            .build();
                    item.addImage(image);
                    isFirst = false;
                }
            }
        }

        Item updatedItem = itemRepository.save(item);
        return mapToDto(updatedItem);
    }

    @Override
    @Transactional
    public void deleteItem(String userEmail, Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        if (!item.getLender().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Unauthorized: You can only delete items that you own.");
        }

        itemRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemAvailabilityDto checkAvailability(Long itemId, LocalDate startDate, LocalDate endDate) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemId));

        LocalDate today = LocalDate.now();
        if (startDate == null) {
            throw new BadRequestException("Start date is required");
        }
        if (endDate == null) {
            throw new BadRequestException("End date is required");
        }
        if (startDate.isBefore(today)) {
            throw new BadRequestException("Start date cannot be in the past");
        }
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("End date must be strictly after start date");
        }

        boolean isAvailable = "AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus());
        String message = isAvailable ? "Item is available for the selected dates!" : "Item is currently not available for rent";

        long days = ChronoUnit.DAYS.between(startDate, endDate);
        BigDecimal rentalAmount = item.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal depositAmount = item.getSecurityDeposit();
        BigDecimal totalAmount = rentalAmount.add(depositAmount);

        return ItemAvailabilityDto.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .isAvailable(isAvailable)
                .message(message)
                .startDate(startDate)
                .endDate(endDate)
                .rentalDays(days)
                .pricePerDay(item.getPricePerDay())
                .rentalAmount(rentalAmount)
                .depositAmount(depositAmount)
                .totalAmount(totalAmount)
                .build();
    }

    private ItemDto mapToDto(Item item) {
        List<ItemImageDto> imageDtos = item.getImages().stream()
                .map(img -> ItemImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.getIsPrimary())
                        .build())
                .collect(Collectors.toList());

        Double avg = reviewRepository.findAverageRatingByItemId(item.getId());
        long count = reviewRepository.countByItemId(item.getId());
        double roundedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;

        return ItemDto.builder()
                .id(item.getId())
                .lenderId(item.getLender().getId())
                .lenderName(item.getLender().getName())
                .lenderEmail(item.getLender().getEmail())
                .name(item.getName())
                .category(item.getCategory())
                .description(item.getDescription())
                .pricePerDay(item.getPricePerDay())
                .securityDeposit(item.getSecurityDeposit())
                .location(item.getLocation())
                .availabilityStatus(item.getAvailabilityStatus())
                .images(imageDtos)
                .averageRating(roundedAvg)
                .totalReviews(count)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
