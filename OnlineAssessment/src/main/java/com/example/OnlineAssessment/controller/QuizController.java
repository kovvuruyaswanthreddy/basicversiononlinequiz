package com.example.OnlineAssessment.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.service.QuestionService;
import com.example.OnlineAssessment.service.QuizService;
import com.example.OnlineAssessment.service.StudentService;
import com.example.OnlineAssessment.entity.Options;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/quiz")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuestionService questionService;

    // ✅ Create a new quiz
    @PostMapping("/create")
    public ResponseEntity<?> createQuiz(@RequestParam String quizId, @RequestParam String quizName) {
        try {
            Quiz quiz = quizService.createQuiz(quizId, quizName);
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }


    // ✅ Activate or deactivate quiz for a specific section/department/year
    @PostMapping("/activate")
    public ResponseEntity<?> activateQuiz(
            @RequestParam String quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean active,
            @RequestParam(defaultValue = "0") int durationMinutes) {

        try {
            @SuppressWarnings("unused")
			QuizActivation activation = quizService.activateQuiz(
                    quizId, section, department, year, active, durationMinutes);

            return ResponseEntity.ok("Quiz activated successfully");

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Invalid Quiz ID");
        }
    }

    
    @Autowired
    StudentService studentService;
    // ✅ Get all active quizzes for a student
    @GetMapping("/active")
    public ResponseEntity<?> getActiveQuizzesForStudent(
            @RequestParam String rollNumber,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year) {

        Student student = studentService.getByRollNumber(rollNumber);

        // 🔐 Credential validation
        if (!student.getStudentSection().equalsIgnoreCase(section)
                || !student.getDepartment().equalsIgnoreCase(department)
                || student.getStudentYear() != year) {

        	return ResponseEntity
        	        .status(HttpStatus.BAD_REQUEST)  // ✅ 400 instead of 401
        	        .body("Invalid student details for section/year/department");
        }

        return ResponseEntity.ok(
                quizService.getActiveQuizzesForStudent(
                        student.getStudentSection(),
                        student.getDepartment(),
                        student.getStudentYear()
                )
        );
    }


    // ✅ Fetch questions for a student only if quiz is active
    @GetMapping("/{quizId}/questions/for-student")
    public List<Questions> getQuestionsForStudent(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @PathVariable String quizId) {

        boolean isActive = quizService.isQuizActiveForStudent(quizId, section, department, year);
        if (!isActive) {
            throw new RuntimeException("You cannot attempt this quiz. Quiz is not active for your class.");
        }
        List<Questions> questions = questionService.getQuestionsByQuizId(quizId);
        for (Questions q : questions) {
            Options opt = q.getOptions();
            if (opt != null && opt.getCorrectOption() != null) {
                // If comma-separated, it's a multiple-choice question
                q.setMultiple(opt.getCorrectOption().contains(","));
                
                // SECURITY: Remove correct option before sending to student!
                // Note: This modifies the object in memory. 
                // Since this is a @GetMapping, usually it's not marked Transactional,
                // but for safety, we are just clearing it for the JSON response.
                opt.setCorrectOption(null);
            }
        }
        return questions;
    }

    // ✅ Fetch questions by quizId (general use)
    @GetMapping("/{quizId}/questions")
    public List<Questions> getQuestionsByQuizId(@PathVariable String quizId) {
        return questionService.getQuestionsByQuizId(quizId);
    }
 // In QuizController
    @GetMapping("/questions/{questionId}/is-multiple")
    public boolean isQuestionMultiple(@PathVariable String questionId) {
        return questionService.isMultiple(questionId);
    }
    @PostMapping("/{quizId}/publish-result")
    public ResponseEntity<String> publishResult(
            @PathVariable String quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean publish) {

        try {
            quizService.publishResults(quizId, section, department, year, publish);

            return ResponseEntity.ok(
                    publish
                            ? "Result published successfully"
                            : "Result unpublished successfully"
            );

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }
    @GetMapping("/{quizId}/key")
    public ResponseEntity<?> getQuizKey(
            @PathVariable String quizId,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer year) {
        
        if (section == null || department == null || year == null || 
            "null".equals(section) || "null".equals(department)) {
            return ResponseEntity.status(HttpStatus.OK).body(List.of()); // Return empty key if details missing
        }
        
        if (!quizService.areResultsPublished(quizId, section, department, year)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Results not yet published.");
        }

        List<Questions> questions = questionService.getQuestionsByQuizId(quizId);
        List<Map<String, Object>> keyList = questions.stream().map(q -> {
            Map<String, Object> map = new HashMap<>();
            map.put("questionId", q.getQuestionId());
            map.put("questionText", q.getQuestionText());
            map.put("marks", q.getMarks());
            map.put("negativeMarks", q.getNegativeMarks());
            
            Options opt = q.getOptions();
            if (opt != null) {
                map.put("option1", opt.getOption1());
                map.put("option2", opt.getOption2());
                map.put("option3", opt.getOption3());
                map.put("option4", opt.getOption4());
                map.put("correctOption", opt.getCorrectOption());
            } else {
                map.put("correctOption", "N/A");
            }
            return map;
        }).toList();

        return ResponseEntity.ok(keyList);
    }


}

