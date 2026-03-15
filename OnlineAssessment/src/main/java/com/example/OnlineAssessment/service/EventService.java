package com.example.OnlineAssessment.service;

import java.util.List;

import com.example.OnlineAssessment.entity.Event;
import com.example.OnlineAssessment.entity.EventQuiz;
import com.example.OnlineAssessment.entity.EventResult;
import org.springframework.web.multipart.MultipartFile;

public interface EventService {
    Event createEvent(String eventId, String eventName, String facultyEmail);
    Event getEventById(String eventId);
    
    // Quiz Management for Event
    EventQuiz activateEventQuiz(String eventId, String quizId, boolean active, int durationMinutes);
    void uploadEventQuestions(MultipartFile file, String eventId, String quizId) throws Exception;
    
    boolean isEventQuizActiveForStudent(String eventId, String quizId, String studentRollNumber);
    List<EventQuiz> getActiveQuizzesForEvent(String eventId);
    void publishEventResults(String eventId, String quizId, boolean publish);

    // Results
    EventResult evaluateAndSaveEventResult(String eventId, String quizId, String rollNumber, java.util.Map<String, String> answers) throws Exception;
    boolean hasAttemptedEventQuiz(String eventId, String quizId, String rollNumber);
    List<EventResult> getEventResults(String eventId, String quizId);
    java.util.Map<String, String> getEventStudentAnswers(String eventId, String quizId, String rollNumber) throws Exception;
    
    // Check if student is in event
    boolean isStudentInEvent(String eventId, String studentRollNumber);

    List<Event> getEventsForStudent(String studentRollNumber);

    List<EventResult> getStudentAllEventResults(String rollNumber);
    List<com.example.OnlineAssessment.entity.EventQuestion> getEventQuestionsWithKey(String eventId, String quizId);
    List<com.example.OnlineAssessment.entity.EventQuestion> getEventQuestionsForStudent(String eventId, String quizId);
}
