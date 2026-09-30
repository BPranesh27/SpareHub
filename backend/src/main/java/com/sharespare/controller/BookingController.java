package com.sharespare.controller;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBookingRequest createBookingRequest) {
        BookingDto booking = bookingService.createBooking(userDetails.getUsername(), createBookingRequest);
        return new ResponseEntity<>(
                ApiResponse.success("Booking created successfully!", booking),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDto>> getBookingById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        BookingDto booking = bookingService.getBookingById(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Booking details retrieved", booking)
        );
    }

    @GetMapping("/my-rentals")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getMyRentals(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BookingDto> rentals = bookingService.getMyRentals(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("User rentals retrieved", rentals)
        );
    }

    @GetMapping("/my-lending")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getMyLending(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BookingDto> lendingBookings = bookingService.getMyLendingBookings(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Lender bookings retrieved", lendingBookings)
        );
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDto>> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        BookingDto cancelledBooking = bookingService.cancelBooking(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Booking cancelled successfully", cancelledBooking)
        );
    }
}
