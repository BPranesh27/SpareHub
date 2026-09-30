package com.sharespare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemImageDto {

    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
}
