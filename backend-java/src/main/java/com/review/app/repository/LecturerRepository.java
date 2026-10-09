package com.review.app.repository;

import com.review.app.model.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LecturerRepository extends JpaRepository<Lecturer, Long> {

    Optional<Lecturer> findByName(String name);

    List<Lecturer> findByDepartment(String department);

    List<Lecturer> findByNameContainingIgnoreCase(String name);

    boolean existsByName(String name);
}
