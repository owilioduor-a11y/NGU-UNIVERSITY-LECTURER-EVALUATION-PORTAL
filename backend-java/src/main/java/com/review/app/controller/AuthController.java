package com.review.app.controller;

import com.review.app.model.User;
import com.review.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        String name = stringValue(body.get("name"));
        String email = stringValue(body.get("email")).toLowerCase();
        String password = body.get("password") != null ? body.get("password").toString() : "";

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            return error("Name, email and password are required.", HttpStatus.BAD_REQUEST);
        }
        if (users.existsByEmail(email)) {
            return error("An account with that email already exists.", HttpStatus.CONFLICT);
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setRole("student");
        user.setPasswordHash(encoder.encode(password));
        users.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", toDto(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String email = stringValue(body.get("email")).toLowerCase();
        String password = body.get("password") != null ? body.get("password").toString() : "";

        Optional<User> found = users.findByEmail(email);
        if (found.isEmpty()
                || !"student".equals(found.get().getRole())
                || !encoder.matches(password, found.get().getPasswordHash())) {
            return error("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", toDto(found.get()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bootstrap")
    public ResponseEntity<Map<String, Object>> bootstrap(@RequestBody Map<String, Object> body) {
        if (users.findFirstByRole("admin").isPresent()) {
            return error("An administrator account already exists.", HttpStatus.CONFLICT);
        }

        String username = stringValue(body.get("username"));
        String password = body.get("password") != null ? body.get("password").toString() : "";
        if (username.isBlank() || password.isBlank()) {
            return error("Username and password are required.", HttpStatus.BAD_REQUEST);
        }

        User admin = new User();
        admin.setName(username);
        admin.setEmail(username.contains("@") ? username.toLowerCase()
                : username.toLowerCase().replace(' ', '.') + "@ngu.local");
        admin.setRole("admin");
        admin.setPasswordHash(encoder.encode(password));
        users.save(admin);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", toDto(admin));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody Map<String, Object> body) {
        String username = stringValue(body.get("username"));
        String password = body.get("password") != null ? body.get("password").toString() : "";

        Optional<User> admin = users.findByRole("admin").stream()
                .filter(user -> user.getName().equalsIgnoreCase(username)
                        || user.getEmail().equalsIgnoreCase(username))
                .findFirst();

        if (admin.isEmpty() || !encoder.matches(password, admin.get().getPasswordHash())) {
            return error("Unauthorized.", HttpStatus.UNAUTHORIZED);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", toDto(admin.get()));
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("name", user.getName());
        dto.put("email", user.getEmail());
        dto.put("role", user.getRole());
        return dto;
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private ResponseEntity<Map<String, Object>> error(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
