package com.example.OnlineAssessment.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.entity.Event;
import com.example.OnlineAssessment.entity.EventResult;
import com.example.OnlineAssessment.service.EventExcelService;
import com.example.OnlineAssessment.service.EventService;
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.entity.EventStudentProfile;
import com.example.OnlineAssessment.repositories.EventStudentProfileRepository;

@RestController
@RequestMapping("/event")
@CrossOrigin(origins = "*")
public class EventController {

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @Autowired
    private EventService eventService;

    @Autowired
    private EventExcelService eventExcelService;


    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EventStudentProfileRepository eventStudentProfileRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createEvent(
            @RequestParam String eventId,
            @RequestParam String eventName,
            @RequestParam String facultyEmail) {
        try {
            Event event = eventService.createEvent(eventId, eventName, facultyEmail);
            return ResponseEntity.ok(event);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/upload-students")
    public ResponseEntity<String> uploadEventStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam("eventId") String eventId,
            @RequestParam("facultyEmail") String facultyEmail) {
        try {
            eventExcelService.uploadEventStudents(file, eventId, facultyEmail);
            return ResponseEntity.ok("Event students uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-questions")
    public ResponseEntity<String> uploadEventQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("eventId") String eventId,
            @RequestParam("quizId") String quizId) {
        try {
            eventService.uploadEventQuestions(file, eventId, quizId);
            return ResponseEntity.ok("Event questions uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/activate-quiz")
    public ResponseEntity<String> activateQuiz(@RequestParam String eventId, @RequestParam String quizId, @RequestParam boolean active, @RequestParam int durationMinutes) {
        try {
            eventService.activateEventQuiz(eventId, quizId, active, durationMinutes);
            return ResponseEntity.ok("Event Quiz " + (active ? "activated" : "deactivated") + " successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/active-quizzes")
    public ResponseEntity<?> getActiveEventQuizzes(
            @RequestParam String eventId,
            @RequestParam String studentRollNumber) {
        if (!eventService.isStudentInEvent(eventId, studentRollNumber)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Student not registered for this event.");
        }
        return ResponseEntity.ok(eventService.getActiveQuizzesForEvent(eventId));
    }

    @GetMapping("/{eventId}/quiz/{quizId}/questions")
    public ResponseEntity<?> getEventQuizQuestions(
            @PathVariable String eventId,
            @PathVariable String quizId,
            @RequestParam String rollNumber) {
        if (!eventService.isEventQuizActiveForStudent(eventId, quizId, rollNumber)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Quiz not active for this event/student.");
        }
        return ResponseEntity.ok(eventService.getEventQuestionsForStudent(eventId, quizId));
    }

    @PostMapping("/submit-result")
    public ResponseEntity<String> submitResult(@RequestBody Map<String, Object> payload) {
        try {
            String eventId = (String) payload.get("eventId");
            String quizId = (String) payload.get("quizId");
            String rollNumber = (String) payload.get("rollNumber");
            @SuppressWarnings("unchecked")
            Map<String, String> answers = (Map<String, String>) payload.get("answers");

            eventService.evaluateAndSaveEventResult(eventId, quizId, rollNumber, answers);
            return ResponseEntity.ok("Result submitted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/results")
    public ResponseEntity<List<EventResult>> getEventResults(@RequestParam String eventId, @RequestParam String quizId) {
        return ResponseEntity.ok(eventService.getEventResults(eventId, quizId));
    }

    @PostMapping("/publish-results")
    public ResponseEntity<String> publishResults(@RequestParam String eventId, @RequestParam String quizId, @RequestParam boolean publish) {
        try {
            eventService.publishEventResults(eventId, quizId, publish);
            return ResponseEntity.ok("Event results " + (publish ? "published" : "hidden") + " successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/student/attempted")
    public ResponseEntity<Boolean> hasStudentAttempted(@RequestParam String eventId, @RequestParam String quizId, @RequestParam String rollNumber) {
        return ResponseEntity.ok(eventService.hasAttemptedEventQuiz(eventId, quizId, rollNumber));
    }

    @GetMapping("/quiz-key")
    public ResponseEntity<?> getEventQuizKey(@RequestParam String eventId, @RequestParam String quizId) {
        if (!eventService.getActiveQuizzesForEvent(eventId).stream()
                .filter(q -> q.getQuizId().equals(quizId))
                .anyMatch(com.example.OnlineAssessment.entity.EventQuiz::isPublished)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Results not yet published.");
        }
        return ResponseEntity.ok(eventService.getEventQuestionsWithKey(eventId, quizId));
    }

    @GetMapping("/student/result")
    public ResponseEntity<?> getStudentEventResult(@RequestParam String eventId, @RequestParam String quizId, @RequestParam String rollNumber) {
        try {
            List<EventResult> results = eventService.getEventResults(eventId, quizId);
            EventResult studentRes = results.stream()
                    .filter(r -> r.getStudentRollNumber().equals(rollNumber))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Result not found"));
            
            return ResponseEntity.ok(studentRes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{eventId}/quiz/{quizId}/student/{rollNumber}/answers")
    public ResponseEntity<?> getEventStudentAnswers(@PathVariable String eventId, @PathVariable String quizId, @PathVariable String rollNumber) {
        try {
            return ResponseEntity.ok(eventService.getEventStudentAnswers(eventId, quizId, rollNumber));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/student/login")
    public ResponseEntity<?> studentEventLogin(@RequestBody Map<String, String> payload) {
        String roll = payload.get("rollNumber");
        String pass = payload.get("password");
        
        try {
            EventStudentProfile profile = eventStudentProfileRepository.findById(roll).orElse(null);
            if (profile != null && profile.getPassword().equals(pass)) {
                // Check student is enrolled in at least one event
                List<Event> events = eventService.getEventsForStudent(roll);
                if (events.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not registered for any events.");
                }

                String token = jwtUtil.generateToken(roll, "EVENT_STUDENT");
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("rollNumber", roll);
                response.put("name", profile.getName());
                response.put("section", profile.getSection());
                response.put("year", profile.getYear());
                response.put("department", profile.getDepartment());
                response.put("email", profile.getEmail());
                response.put("role", "EVENT_STUDENT");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid credentials");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/student/all-results")
    public ResponseEntity<List<EventResult>> getStudentAllEventResults(@RequestParam String rollNumber) {
        return ResponseEntity.ok(eventService.getStudentAllEventResults(rollNumber));
    }

    @GetMapping("/student/events")
    public ResponseEntity<List<Event>> getEventsForStudent(@RequestParam String rollNumber) {
        return ResponseEntity.ok(eventService.getEventsForStudent(rollNumber));
    }
}
