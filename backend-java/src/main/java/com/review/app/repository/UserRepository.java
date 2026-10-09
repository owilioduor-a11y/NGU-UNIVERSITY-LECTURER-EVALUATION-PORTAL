package com.review.app.repository;

import com.review.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findFirstByRole(String role);

    List<User> findByRole(String role);

    boolean existsByEmail(String email);
}
