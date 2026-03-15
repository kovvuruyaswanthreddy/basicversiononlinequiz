package com.example.OnlineAssessment.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.entity.Event;
import com.example.OnlineAssessment.entity.EventQuiz;
import com.example.OnlineAssessment.entity.EventQuestion;
import com.example.OnlineAssessment.entity.EventResult;
import com.example.OnlineAssessment.repositories.EventRepository;
import com.example.OnlineAssessment.repositories.EventQuizRepository;
import com.example.OnlineAssessment.repositories.EventQuestionRepository;
import com.example.OnlineAssessment.repositories.EventResultRepository;
import com.example.OnlineAssessment.repositories.EventStudentRepository;
import com.example.OnlineAssessment.entity.EventStudentProfile;
import com.example.OnlineAssessment.repositories.EventStudentProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EventServiceImpl implements EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventStudentRepository eventStudentRepository;

    @Autowired
    private EventQuizRepository eventQuizRepository;

    @Autowired
    private EventQuestionRepository eventQuestionRepository;

    @Autowired
    private EventResultRepository eventResultRepository;

    @Autowired
    private EventQuestionExcelService eventQuestionExcelService;

    @Autowired
    private EventStudentProfileRepository eventStudentProfileRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Event createEvent(String eventId, String eventName, String facultyEmail) {
        if (eventRepository.existsById(eventId)) {
            throw new RuntimeException("Event already exists!");
        }
        Event event = new Event();
        event.setEventId(eventId);
        event.setEventName(eventName);
        event.setFacultyEmail(facultyEmail);
        return eventRepository.save(event);
    }

    @Override
    public Event getEventById(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    @Override
    public EventQuiz activateEventQuiz(String eventId, String quizId, boolean active, int durationMinutes) {
        if (!eventRepository.existsById(eventId)) {
            throw new RuntimeException("Event not found");
        }

        EventQuiz quiz = eventQuizRepository.findByEventIdAndQuizId(eventId, quizId)
                .orElse(new EventQuiz());

        quiz.setEventId(eventId);
        quiz.setQuizId(quizId);
        quiz.setQuizName(quizId); // Default to quizId as name
        quiz.setActive(active);
        quiz.setDurationMinutes(durationMinutes);

        return eventQuizRepository.save(quiz);
    }

    @Override
    public void uploadEventQuestions(MultipartFile file, String eventId, String quizId) throws Exception {
        eventQuestionExcelService.uploadEventQuestions(file, eventId, quizId);
    }

    @Override
    public boolean isEventQuizActiveForStudent(String eventId, String quizId, String studentRollNumber) {
        if (!isStudentInEvent(eventId, studentRollNumber)) {
            return false;
        }

        Optional<EventQuiz> quizOpt = eventQuizRepository.findByEventIdAndQuizId(eventId, quizId);
        return quizOpt.isPresent() && quizOpt.get().isActive();
    }

    @Override
    public List<EventQuiz> getActiveQuizzesForEvent(String eventId) {
        return eventQuizRepository.findByEventIdAndActiveTrue(eventId);
    }

    @Override
    public void publishEventResults(String eventId, String quizId, boolean publish) {
        EventQuiz quiz = eventQuizRepository.findByEventIdAndQuizId(eventId, quizId)
                .orElseThrow(() -> new RuntimeException("Event Quiz not found"));

        quiz.setPublished(publish);
        eventQuizRepository.save(quiz);
    }

    @Override
    public EventResult evaluateAndSaveEventResult(String eventId, String quizId, String rollNumber, Map<String, String> answers) throws Exception {
        if (hasAttemptedEventQuiz(eventId, quizId, rollNumber)) {
            throw new RuntimeException("Quiz already submitted.");
        }

        double score = 0.0;
        int maxMarks = 0;

        List<EventQuestion> eventQuestions = eventQuestionRepository.findByEventIdAndQuizId(eventId, quizId);

        for (EventQuestion q : eventQuestions) {
            String qId = q.getQuestionId();
            String studentAns = answers.get(qId);
            
            maxMarks += q.getMarks();

            if (studentAns != null && !studentAns.trim().isEmpty()) {
                if (isCorrect(studentAns, q.getCorrectOption())) {
                    score += q.getMarks();
                } else {
                    score -= q.getNegativeMarks();
                }
            }
        }

        EventResult result = new EventResult();
        result.setEventId(eventId);
        result.setQuizId(quizId);
        result.setStudentRollNumber(rollNumber);
        result.setScore(score);
        result.setTotalMarks(maxMarks);
        result.setSubmissionTime(LocalDateTime.now());
        
        // Save answers as JSON or simple string
        try { result.setAnswers(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(answers)); } catch(Exception e) {}
        
        double percentage = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
        result.setPassFail(percentage >= 40 ? "PASS" : "FAIL");

        return eventResultRepository.save(result);
    }

    private boolean isCorrect(String studentAns, String correctAns) {
        if (studentAns == null || correctAns == null) return false;
        
        // Handle multiple options (comma separated)
        String[] sParts = studentAns.split(",");
        String[] cParts = correctAns.split(",");
        
        if (sParts.length != cParts.length) return false;
        
        java.util.Set<String> sSet = new java.util.HashSet<>(java.util.Arrays.asList(sParts));
        java.util.Set<String> cSet = new java.util.HashSet<>(java.util.Arrays.asList(cParts));
        
        for (String s : sSet) {
            if (!cSet.contains(s.trim())) return false;
        }
        return true;
    }

    @Override
    public boolean hasAttemptedEventQuiz(String eventId, String quizId, String rollNumber) {
        return eventResultRepository.existsByEventIdAndQuizIdAndStudentRollNumber(eventId, quizId, rollNumber);
    }

    @Override
    public List<EventResult> getEventResults(String eventId, String quizId) {
        List<EventResult> results = eventResultRepository.findByEventIdAndQuizIdOrderByScoreDescSubmissionTimeAsc(eventId, quizId);
        
        // Populate names
        for (EventResult r : results) {
            eventStudentProfileRepository.findById(r.getStudentRollNumber())
                .ifPresent(p -> r.setStudentName(p.getName()));
        }
        
        return results;
    }

    @Override
    public Map<String, String> getEventStudentAnswers(String eventId, String quizId, String rollNumber) throws Exception {
        Optional<EventResult> resultOpt = eventResultRepository.findByEventIdAndQuizId(eventId, quizId).stream()
                .filter(r -> r.getStudentRollNumber().equals(rollNumber))
                .findFirst();

        if (resultOpt.isPresent()) {
            return objectMapper.readValue(resultOpt.get().getAnswers(), new TypeReference<Map<String, String>>() {});
        }
        return new HashMap<>();
    }

    @Override
    public List<EventQuestion> getEventQuestionsForStudent(String eventId, String quizId) {
        List<EventQuestion> questions = eventQuestionRepository.findByEventIdAndQuizId(eventId, quizId);
        for (EventQuestion q : questions) {
            // Check if multiple options are correct
            if (q.getCorrectOption() != null && q.getCorrectOption().contains(",")) {
                q.setMultiple(true);
            } else {
                q.setMultiple(false);
            }
            // Clear correct option for security
            q.setCorrectOption(null);
        }
        return questions;
    }

    @Override
    public boolean isStudentInEvent(String eventId, String studentRollNumber) {
        return eventStudentRepository.existsByEventIdAndStudentRollNumber(eventId, studentRollNumber);
    }

    @Override
    public List<Event> getEventsForStudent(String studentRollNumber) {
        List<String> eventIds = eventStudentRepository.findByStudentRollNumber(studentRollNumber)
                .stream().map(com.example.OnlineAssessment.entity.EventStudent::getEventId).toList();
        return eventRepository.findAllById(eventIds);
    }

    @Override
    public List<EventResult> getStudentAllEventResults(String rollNumber) {
        String name = eventStudentProfileRepository.findById(rollNumber)
                .map(EventStudentProfile::getName).orElse("Unknown");

        List<EventResult> allResults = eventResultRepository.findByStudentRollNumber(rollNumber);
        return allResults.stream()
            .filter(res -> {
                Optional<EventQuiz> q = eventQuizRepository.findByEventIdAndQuizId(res.getEventId(), res.getQuizId());
                return q.isPresent() && q.get().isPublished();
            })
            .peek(res -> {
                res.setStudentName(name);
                List<EventQuestion> questions = eventQuestionRepository.findByEventIdAndQuizId(res.getEventId(), res.getQuizId());
                int totalMarks = questions.stream().mapToInt(EventQuestion::getMarks).sum();
                res.setTotalMarks(totalMarks);
                double percentage = totalMarks > 0 ? (res.getScore() / totalMarks) * 100 : 0;
                res.setPassFail(percentage >= 40 ? "PASS" : "FAIL");
            })
            .toList();
    }

    @Override
    public List<EventQuestion> getEventQuestionsWithKey(String eventId, String quizId) {
        return eventQuestionRepository.findByEventIdAndQuizId(eventId, quizId);
    }
}
