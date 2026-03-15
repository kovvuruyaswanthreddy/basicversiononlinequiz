package com.example.OnlineAssessment.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

@Entity
public class Questions {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(updatable = false, nullable = false)
	private String questionId;

    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    @ManyToOne
    @JoinColumn(name = "quizId")
    private Quiz quiz;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private Options options;

    private int marks = 1;
    private double negativeMarks = 0.0;
    
    @jakarta.persistence.Transient
    private boolean multiple;

    // Getters & Setters
    public boolean isMultiple() { return multiple; }
    public void setMultiple(boolean multiple) { this.multiple = multiple; }
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public Options getOptions() { return options; }
    public void setOptions(Options options) { this.options = options; }

    public int getMarks() { return marks; }
    public void setMarks(int marks) { this.marks = marks; }

    public double getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(double negativeMarks) { this.negativeMarks = negativeMarks; }
}
