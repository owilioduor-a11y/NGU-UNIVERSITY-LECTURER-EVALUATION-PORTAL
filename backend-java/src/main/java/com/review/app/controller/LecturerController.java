package com.review.app.controller;

import com.review.app.model.Lecturer;
import com.review.app.model.Review;
import com.review.app.repository.LecturerRepository;
import com.review.app.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lecturers")
@CrossOrigin(origins = "*")
public class LecturerController {

    private final LecturerRepository lecturers;
    private final ReviewRepository reviews;
    private final PasswordEncoder encoder;

    public LecturerController(LecturerRepository lecturers,
                              ReviewRepository reviews,
                              PasswordEncoder encoder) {
        this.lecturers = lecturers;
        this.reviews = reviews;
        this.encoder = encoder;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) String department) {
        List<Lecturer> results;
        if (q != null && !q.isBlank()) {
            results = lecturers.findByNameContainingIgnoreCase(q);
        } else if (department != null && !department.isBlank()) {
            results = lecturers.findByDepartment(department);
        } else {
            results = lecturers.findAll();
        }

        List<Map<String, Object>> payload = new ArrayList<>();
        for (Lecturer lecturer : results) {
            payload.add(summary(lecturer));
        }
        return payload;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable Long id) {
        Optional<Lecturer> found = lecturers.findById(id);
        if (found.isEmpty()) {
            return notFound();
        }

        Lecturer lecturer = found.get();
        Map<String, Object> payload = summary(lecturer);

        List<Map<String, Object>> reviewDtos = new ArrayList<>();
        for (Review review : reviews.findByLecturerIdOrderByCreatedAtDesc(id)) {
            reviewDtos.add(reviewDto(review));
        }
        payload.put("reviews", reviewDtos);
        return ResponseEntity.ok(payload);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        String name = stringValue(body.get("name"));
        if (name.isBlank()) {
            return badRequest("Lecturer name is required.");
        }
        if (lecturers.existsByName(name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(error("A lecturer with that name already exists."));
        }

        Lecturer lecturer = new Lecturer();
        lecturer.setName(name);
        lecturer.setDepartment(stringValue(body.get("department")).isBlank()
                ? "General" : stringValue(body.get("department")));
        lecturers.save(lecturer);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("lecturer", baseDto(lecturer));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pins/{name}")
    public Map<String, Object> pinStatus(@PathVariable String name) {
        Optional<Lecturer> found = lecturers.findByName(name);
        Map<String, Object> response = new HashMap<>();
        response.put("name", name);
        response.put("pin_set", found.isPresent() && found.get().getPinHash() != null);
        return response;
    }

    @PostMapping("/pins")
    public ResponseEntity<Map<String, Object>> setPin(@RequestBody Map<String, Object> body) {
        String name = stringValue(body.get("name"));
        String pin = body.get("pin") != null ? body.get("pin").toString() : "";
        if (name.isBlank() || pin.isBlank()) {
            return badRequest("Lecturer name and PIN are required.");
        }

        Lecturer lecturer = lecturers.findByName(name).orElseGet(() -> {
            Lecturer created = new Lecturer();
            created.setName(name);
            String department = stringValue(body.get("department"));
            created.setDepartment(department.isBlank() ? "General" : department);
            return created;
        });

        lecturer.setPinHash(encoder.encode(pin));
        lecturers.save(lecturer);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("lecturer", baseDto(lecturer));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String name = stringValue(body.get("name"));
        String pin = body.get("pin") != null ? body.get("pin").toString() : "";

        Optional<Lecturer> found = lecturers.findByName(name);
        if (found.isEmpty() || found.get().getPinHash() == null
                || !encoder.matches(pin, found.get().getPinHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(error("Invalid PIN."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("lecturer", baseDto(found.get()));
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> summary(Lecturer lecturer) {
        Map<String, Object> dto = baseDto(lecturer);
        List<Review> lecturerReviews = reviews.findByLecturerIdOrderByCreatedAtDesc(lecturer.getId());
        dto.put("review_count", lecturerReviews.size());
        dto.put("average_rating", lecturerReviews.isEmpty() ? 0.0
                : Math.round(lecturerReviews.stream().mapToInt(Review::getScore).average().orElse(0) * 100.0) / 100.0);
        return dto;
    }

    private Map<String, Object> baseDto(Lecturer lecturer) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", lecturer.getId());
        dto.put("name", lecturer.getName());
        dto.put("department", lecturer.getDepartment());
        dto.put("has_pin", lecturer.getPinHash() != null);
        return dto;
    }

    private Map<String, Object> reviewDto(Review review) {
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

    private String stringValue(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        return ResponseEntity.badRequest().body(error(message));
    }

    private ResponseEntity<Map<String, Object>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Lecturer not found."));
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        return body;
    }
}
