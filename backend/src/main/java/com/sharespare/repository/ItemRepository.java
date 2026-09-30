package com.sharespare.repository;

import com.sharespare.entity.Item;
import com.sharespare.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByLenderOrderByIdDesc(User lender);

    Page<Item> findByAvailabilityStatusOrderByIdDesc(String availabilityStatus, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:location IS NULL OR LOWER(i.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "i.availabilityStatus = 'AVAILABLE'")
    Page<Item> searchItems(
            @Param("category") String category,
            @Param("location") String location,
            @Param("search") String search,
            Pageable pageable
    );
}
