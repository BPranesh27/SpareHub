package com.sharespare.service;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.response.BookingDto;

import java.util.List;

public interface BookingService {

    BookingDto createBooking(String userEmail, CreateBookingRequest createBookingRequest);

    BookingDto getBookingById(String userEmail, Long bookingId);

    List<BookingDto> getMyRentals(String userEmail);

    List<BookingDto> getMyLendingBookings(String userEmail);

    BookingDto cancelBooking(String userEmail, Long bookingId);
}
