package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;

@Entity
public class EventQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String questionId;

    private String eventId;
    private String quizId;

    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String correctOption;

    private int marks = 1;
    private double negativeMarks = 0.0;
    
    @Transient
    private boolean multiple;

    // Getters & Setters
    public boolean isMultiple() { return multiple; }
    public void setMultiple(boolean multiple) { this.multiple = multiple; }
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getOption1() { return option1; }
    public void setOption1(String option1) { this.option1 = option1; }

    public String getOption2() { return option2; }
    public void setOption2(String option2) { this.option2 = option2; }

    public String getOption3() { return option3; }
    public void setOption3(String option3) { this.option3 = option3; }

    public String getOption4() { return option4; }
    public void setOption4(String option4) { this.option4 = option4; }

    public String getCorrectOption() { return correctOption; }
    public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }

    public int getMarks() { return marks; }
    public void setMarks(int marks) { this.marks = marks; }

    public double getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(double negativeMarks) { this.negativeMarks = negativeMarks; }
}
