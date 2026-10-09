package com.review.app.repository;

import com.review.app.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByLecturerIdOrderByCreatedAtDesc(Long lecturerId);

    List<Review> findAllByOrderByCreatedAtDesc();

    long countByLecturerId(Long lecturerId);
}
