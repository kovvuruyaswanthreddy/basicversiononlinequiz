package com.example.OnlineAssessment.service;

import java.io.InputStream;
import java.util.List;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.entity.EventQuestion;
import com.example.OnlineAssessment.repositories.EventQuestionRepository;
import com.example.OnlineAssessment.repositories.EventQuizRepository;

@Service
public class EventQuestionExcelService {

    @Autowired
    private EventQuestionRepository eventQuestionRepo;

    @Autowired
    private EventQuizRepository eventQuizRepo;

    public void uploadEventQuestions(MultipartFile file, String eventId, String quizId) throws Exception {

        if (!eventQuizRepo.existsByEventIdAndQuizId(eventId, quizId)) {
            // Auto-create EventQuiz if not exists
            // Or throw error. Let's auto-create for easier UX or at least check event
        }

        List<EventQuestion> existing = eventQuestionRepo.findByEventIdAndQuizId(eventId, quizId);
        if (!existing.isEmpty()) {
            throw new RuntimeException("Questions already uploaded for this Event Quiz.");
        }

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                EventQuestion eq = new EventQuestion();
                eq.setEventId(eventId);
                eq.setQuizId(quizId);
                eq.setQuestionText(formatter.formatCellValue(row.getCell(0)).trim());
                eq.setOption1(formatter.formatCellValue(row.getCell(1)).trim());
                eq.setOption2(formatter.formatCellValue(row.getCell(2)).trim());
                eq.setOption3(formatter.formatCellValue(row.getCell(3)).trim());
                eq.setOption4(formatter.formatCellValue(row.getCell(4)).trim());
                eq.setCorrectOption(formatter.formatCellValue(row.getCell(5)).trim());
                
                String marksStr = formatter.formatCellValue(row.getCell(6)).trim();
                if (!marksStr.isEmpty()) {
                    try { eq.setMarks(Integer.parseInt(marksStr)); } catch(Exception e) {}
                }

                String negMarksStr = formatter.formatCellValue(row.getCell(7)).trim();
                if (!negMarksStr.isEmpty()) {
                    try { eq.setNegativeMarks(Double.parseDouble(negMarksStr)); } catch(Exception e) {}
                }

                eventQuestionRepo.save(eq);
            }
        }
    }
}
