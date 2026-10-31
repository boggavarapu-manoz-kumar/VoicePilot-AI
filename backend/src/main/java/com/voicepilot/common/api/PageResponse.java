package com.voicepilot.common.api;

import org.springframework.data.domain.Page;
import java.util.List;
import java.util.function.Function;

/**
 * Reusable typed pagination response envelope.
 * Maps cleanly from Spring Data Page instances without exposing internal pagination infrastructure.
 *
 * @param <T> Item payload type
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
        List<D> mappedContent = page.getContent().stream().map(mapper).toList();
        return new PageResponse<>(
                mappedContent,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}

