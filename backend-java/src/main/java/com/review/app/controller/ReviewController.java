package com.review.app.controller;

import com.review.app.model.Lecturer;
import com.review.app.model.Review;
import com.review.app.repository.LecturerRepository;
import com.review.app.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ReviewController {

    private static final Set<String> POSITIVE = new HashSet<>(Arrays.asList(
            "good", "great", "excellent", "amazing", "helpful", "clear", "engaging",
            "knowledgeable", "inspiring", "organized", "supportive", "recommend"));

    private static final Set<String> NEGATIVE = new HashSet<>(Arrays.asList(
            "bad", "poor", "terrible", "boring", "confusing", "unclear", "rude",
            "disorganized", "unhelpful", "difficult"));

    private final ReviewRepository reviews;
    private final LecturerRepository lecturers;

    public ReviewController(ReviewRepository reviews, LecturerRepository lecturers) {
        this.reviews = reviews;
        this.lecturers = lecturers;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", "ok");
        response.put("service", "lecturer-review-service");
        return response;
    }

    @GetMapping("/reviews")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> payload = new ArrayList<>();
        for (Review review : reviews.findAllByOrderByCreatedAtDesc()) {
            payload.add(toDto(review));
        }
        return payload;
    }

    @GetMapping("/reviews/lecturer/{lecturerId}")
    public ResponseEntity<List<Map<String, Object>>> forLecturer(@PathVariable Long lecturerId) {
        List<Map<String, Object>> payload = new ArrayList<>();
        for (Review review : reviews.findByLecturerIdOrderByCreatedAtDesc(lecturerId)) {
            payload.add(toDto(review));
        }
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/reviews")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Long lecturerId = optionalLong(body.get("lecturer_id"));
        Lecturer lecturer = null;

        if (lecturerId != null) {
            lecturer = lecturers.findById(lecturerId).orElse(null);
        } else if (body.get("lecturer") != null) {
            String name = body.get("lecturer").toString().trim();
            lecturer = lecturers.findByName(name).orElseGet(() -> {
                Lecturer created = new Lecturer();
                created.setName(name);
                created.setDepartment("General");
                return created;
            });
        }

        if (lecturer == null) {
            return error("A valid lecturer is required.", HttpStatus.BAD_REQUEST);
        }

        String unit = body.get("unit") != null ? body.get("unit").toString().trim() : "";
        if (unit.isBlank()) {
            return error("Unit is required.", HttpStatus.BAD_REQUEST);
        }

        Integer score;
        try {
            score = Integer.valueOf(body.get("score").toString());
        } catch (Exception exception) {
            return error("Score must be an integer between 0 and 100.", HttpStatus.BAD_REQUEST);
        }
        if (score < 0 || score > 100) {
            return error("Score must be between 0 and 100.", HttpStatus.BAD_REQUEST);
        }

        String comment = body.get("comment") != null ? body.get("comment").toString().trim() : "";

        Review review = new Review();
        review.setLecturer(lecturer);
        review.setUnit(unit);
        review.setScore(score);
        review.setComment(comment);
        review.setSentiment(analyzeSentiment(comment));
        review.setStudentName(body.get("student_name") != null
                ? body.get("student_name").toString() : "Anonymous");
        review.setStudentEmail(body.get("student_email") != null
                ? body.get("student_email").toString() : null);
        reviews.save(review);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("review", toDto(review));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/analytics/overview")
    public Map<String, Object> overview() {
        List<Review> all = reviews.findAll();
        List<Lecturer> allLecturers = lecturers.findAll();

        Map<String, Object> response = new HashMap<>();
        response.put("lecturer_count", allLecturers.size());
        response.put("review_count", all.size());
        response.put("average_rating", all.isEmpty() ? 0.0
                : Math.round(all.stream().mapToInt(Review::getScore).average().orElse(0) * 100.0) / 100.0);
        return response;
    }

    static String analyzeSentiment(String text) {
        if (text == null || text.isBlank()) {
            return "neutral";
        }
        int positive = 0;
        int negative = 0;
        for (String token : text.toLowerCase(Locale.ROOT).split("[^a-z]+")) {
            if (POSITIVE.contains(token)) {
                positive++;
            } else if (NEGATIVE.contains(token)) {
                negative++;
            }
        }
        if (positive > negative) {
            return "positive";
        }
        if (negative > positive) {
            return "negative";
        }
        return "neutral";
    }

    private Map<String, Object> toDto(Review review) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", review.getId());
        dto.put("student_name", review.getStudentName());
        dto.put("student_email", review.getStudentEmail());
        dto.put("lecturer_id", review.getLecturer().getId());
        dto.put("lecturer_name", review.getLecturer().getName());
        dto.put("unit", review.getUnit());
        dto.put("score", review.getScore());
        dto.put("comment", review.getComment());
        dto.put("sentiment", review.getSentiment());
        dto.put("created_at", review.getCreatedAt());
        return dto;
    }

    private Long optionalLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private ResponseEntity<Map<String, Object>> error(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
