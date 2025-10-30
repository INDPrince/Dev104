import { database } from './config';
import { ref, set, get, remove, update, push, child } from 'firebase/database';

// Classes Management
export const getAllClasses = async () => {
  try {
    const classesRef = ref(database, 'classes');
    const snapshot = await get(classesRef);
    if (snapshot.exists()) {
      const classes = [];
      snapshot.forEach((childSnapshot) => {
        classes.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Sort by order
      return classes.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    // Return default classes if none exist
    return [
      { id: '10th', name: '10th', order: 1, theme: { id: 'blue', primary: '#2563EB' } },
      { id: '11th', name: '11th', order: 2, theme: { id: 'green', primary: '#10B981' } },
      { id: '12th', name: '12th', order: 3, theme: { id: 'pink', primary: '#EC4899' } }
    ];
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [
      { id: '10th', name: '10th', order: 1, theme: { id: 'blue', primary: '#2563EB' } },
      { id: '11th', name: '11th', order: 2, theme: { id: 'green', primary: '#10B981' } },
      { id: '12th', name: '12th', order: 3, theme: { id: 'pink', primary: '#EC4899' } }
    ];
  }
};

export const createClass = async (classData) => {
  try {
    const classesRef = ref(database, 'classes');
    const newClassRef = push(classesRef);
    await set(newClassRef, {
      ...classData,
      id: newClassRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newClassRef.key };
  } catch (error) {
    console.error('Error creating class:', error);
    return { success: false, error: error.message };
  }
};

export const updateClass = async (classId, updates) => {
  try {
    const classRef = ref(database, `classes/${classId}`);
    await update(classRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating class:', error);
    return { success: false, error: error.message };
  }
};

export const deleteClass = async (classId) => {
  try {
    const classRef = ref(database, `classes/${classId}`);
    await remove(classRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
};

// Reorder classes
export const reorderClasses = async (classes) => {
  try {
    const updates = {};
    classes.forEach((cls, index) => {
      updates[`classes/${cls.id}/order`] = index + 1;
    });
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error reordering classes:', error);
    return { success: false, error: error.message };
  }
};

// Subjects
export const createSubject = async (subjectData) => {
  try {
    const subjectsRef = ref(database, 'subjects');
    const newSubjectRef = push(subjectsRef);
    await set(newSubjectRef, {
      ...subjectData,
      id: newSubjectRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newSubjectRef.key };
  } catch (error) {
    console.error('Error creating subject:', error);
    return { success: false, error: error.message };
  }
};

export const getAllSubjects = async () => {
  try {
    const subjectsRef = ref(database, 'subjects');
    const snapshot = await get(subjectsRef);
    if (snapshot.exists()) {
      const subjects = [];
      snapshot.forEach((childSnapshot) => {
        subjects.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return subjects;
    }
    return [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    const subjectRef = ref(database, `subjects/${subjectId}`);
    await remove(subjectRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { success: false, error: error.message };
  }
};

// Chapters
export const getChaptersBySubject = async (subjectId) => {
  try {
    const chaptersRef = ref(database, `chapters/${subjectId}`);
    const snapshot = await get(chaptersRef);
    if (snapshot.exists()) {
      const chapters = [];
      snapshot.forEach((childSnapshot) => {
        chapters.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return chapters.sort((a, b) => (a.serial || 0) - (b.serial || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
};

export const createChapter = async (subjectId, chapterData) => {
  try {
    const chaptersRef = ref(database, `chapters/${subjectId}`);
    const newChapterRef = push(chaptersRef);
    await set(newChapterRef, {
      ...chapterData,
      id: newChapterRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newChapterRef.key };
  } catch (error) {
    console.error('Error creating chapter:', error);
    return { success: false, error: error.message };
  }
};

export const updateChapter = async (subjectId, chapterId, updates) => {
  try {
    const chapterRef = ref(database, `chapters/${subjectId}/${chapterId}`);
    await update(chapterRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating chapter:', error);
    return { success: false, error: error.message };
  }
};

export const deleteChapter = async (subjectId, chapterId) => {
  try {
    const chapterRef = ref(database, `chapters/${subjectId}/${chapterId}`);
    await remove(chapterRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return { success: false, error: error.message };
  }
};

export const reorderChapters = async (subjectId, chapters) => {
  try {
    const updates = {};
    chapters.forEach((chapter, index) => {
      updates[`chapters/${subjectId}/${chapter.id}/serial`] = index + 1;
    });
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error reordering chapters:', error);
    return { success: false, error: error.message };
  }
};

// Questions
export const getQuestionsByChapter = async (chapterId) => {
  try {
    const questionsRef = ref(database, `questions/${chapterId}`);
    const snapshot = await get(questionsRef);
    if (snapshot.exists()) {
      const questions = [];
      snapshot.forEach((childSnapshot) => {
        questions.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return questions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

export const uploadQuestions = async (chapterId, questions, isUpdate = false) => {
  try {
    const questionsRef = ref(database, `questions/${chapterId}`);
    
    if (isUpdate) {
      // Clear existing questions first
      await remove(questionsRef);
    }
    
    // Upload new questions
    const uploads = questions.map(question => {
      const newQuestionRef = push(questionsRef);
      return set(newQuestionRef, {
        ...question,
        id: newQuestionRef.key,
        createdAt: Date.now()
      });
    });
    
    await Promise.all(uploads);
    
    // Update chapter question count
    const chapterRef = ref(database, `chapters`);
    const snapshot = await get(chapterRef);
    
    snapshot.forEach((subjectSnapshot) => {
      subjectSnapshot.forEach((chapterSnapshot) => {
        if (chapterSnapshot.key === chapterId) {
          const subjectId = subjectSnapshot.key;
          update(ref(database, `chapters/${subjectId}/${chapterId}`), {
            questionCount: questions.length
          });
        }
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error uploading questions:', error);
    return { success: false, error: error.message };
  }
};

// Reports
export const createReport = async (reportData) => {
  try {
    const reportsRef = ref(database, 'reports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, {
      ...reportData,
      id: newReportRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newReportRef.key };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false, error: error.message };
  }
};

export const getAllReports = async () => {
  try {
    const reportsRef = ref(database, 'reports');
    const snapshot = await get(reportsRef);
    if (snapshot.exists()) {
      const reports = [];
      snapshot.forEach((childSnapshot) => {
        reports.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const reportRef = ref(database, `reports/${reportId}`);
    await update(reportRef, { status, updatedAt: Date.now() });
    return { success: true };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { success: false, error: error.message };
  }
};

export const deleteReport = async (reportId) => {
  try {
    const reportRef = ref(database, `reports/${reportId}`);
    await remove(reportRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, error: error.message };
  }
};

// Past Reports Management
export const createPastReport = async (reportData) => {
  try {
    const pastReportsRef = ref(database, 'pastReports');
    const newPastReportRef = push(pastReportsRef);
    await set(newPastReportRef, {
      ...reportData,
      id: reportData.id || newPastReportRef.key, // Keep original report ID
      pastReportId: newPastReportRef.key, // Unique ID for past report entry
      resolvedAt: Date.now()
    });
    return { success: true, id: newPastReportRef.key };
  } catch (error) {
    console.error('Error creating past report:', error);
    return { success: false, error: error.message };
  }
};

export const getAllPastReports = async () => {
  try {
    const pastReportsRef = ref(database, 'pastReports');
    const snapshot = await get(pastReportsRef);
    if (snapshot.exists()) {
      const pastReports = [];
      snapshot.forEach((childSnapshot) => {
        pastReports.push({
          ...childSnapshot.val(),
          pastReportId: childSnapshot.key // Keep the Firebase key for deletion
        });
      });
      return pastReports.sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching past reports:', error);
    return [];
  }
};

export const deletePastReport = async (pastReportId) => {
  try {
    const pastReportRef = ref(database, `pastReports/${pastReportId}`);
    await remove(pastReportRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting past report:', error);
    return { success: false, error: error.message };
  }
};

export const markQuestionAsVerified = async (questionId, isWordMeaning = false, pageOrChapterId = null) => {
  try {
    let questionRef;
    if (isWordMeaning && pageOrChapterId) {
      // WordMeaning: wordMeaning/questions/${pageId}/${questionId}
      questionRef = ref(database, `wordMeaning/questions/${pageOrChapterId}/${questionId}`);
    } else if (pageOrChapterId) {
      // Regular: questions/${chapterId}/${questionId}
      questionRef = ref(database, `questions/${pageOrChapterId}/${questionId}`);
    } else {
      // Fallback: Search for the question
      const questionsRef = ref(database, 'questions');
      const snapshot = await get(questionsRef);
      let found = false;
      
      if (snapshot.exists()) {
        snapshot.forEach((chapterSnapshot) => {
          chapterSnapshot.forEach((questionSnapshot) => {
            if (questionSnapshot.key === questionId) {
              questionRef = ref(database, `questions/${chapterSnapshot.key}/${questionId}`);
              found = true;
            }
          });
        });
      }
      
      if (!found) {
        return { success: false, error: 'Question not found' };
      }
    }
    
    await update(questionRef, { verified: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking question as verified:', error);
    return { success: false, error: error.message };
  }
};

export const unmarkQuestionAsVerified = async (questionId, isWordMeaning = false, pageOrChapterId = null) => {
  try {
    let questionRef;
    if (isWordMeaning && pageOrChapterId) {
      // WordMeaning: wordMeaning/questions/${pageId}/${questionId}
      questionRef = ref(database, `wordMeaning/questions/${pageOrChapterId}/${questionId}`);
    } else if (pageOrChapterId) {
      // Regular: questions/${chapterId}/${questionId}
      questionRef = ref(database, `questions/${pageOrChapterId}/${questionId}`);
    } else {
      // Fallback: Search for the question
      const questionsRef = ref(database, 'questions');
      const snapshot = await get(questionsRef);
      let found = false;
      
      if (snapshot.exists()) {
        snapshot.forEach((chapterSnapshot) => {
          chapterSnapshot.forEach((questionSnapshot) => {
            if (questionSnapshot.key === questionId) {
              questionRef = ref(database, `questions/${chapterSnapshot.key}/${questionId}`);
              found = true;
            }
          });
        });
      }
      
      if (!found) {
        return { success: false, error: 'Question not found' };
      }
    }
    
    await update(questionRef, { verified: false });
    return { success: true };
  } catch (error) {
    console.error('Error unmarking question as verified:', error);
    return { success: false, error: error.message };
  }
};

// Admin Credentials
export const getAdminCredentials = async () => {
  try {
    const adminRef = ref(database, 'admin');
    const snapshot = await get(adminRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return { email: 'anandmanju2889@gmail.com', password: 'Prince774623' };
  } catch (error) {
    console.error('Error fetching admin credentials:', error);
    return { email: 'anandmanju2889@gmail.com', password: 'Prince774623' };
  }
};

export const updateAdminCredentials = async (email, password) => {
  try {
    const adminRef = ref(database, 'admin');
    await set(adminRef, { email, password });
    return { success: true };
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    return { success: false, error: error.message };
  }
};

// Word Meaning Management
export const getWordMeaningSubjects = async () => {
  try {
    const subjectsRef = ref(database, 'wordMeaning/subjects');
    const snapshot = await get(subjectsRef);
    if (snapshot.exists()) {
      const subjects = [];
      snapshot.forEach((childSnapshot) => {
        subjects.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return subjects;
    }
    return [];
  } catch (error) {
    console.error('Error fetching word meaning subjects:', error);
    return [];
  }
};

export const createWordMeaningSubject = async (subjectData) => {
  try {
    const subjectsRef = ref(database, 'wordMeaning/subjects');
    const newSubjectRef = push(subjectsRef);
    await set(newSubjectRef, {
      ...subjectData,
      id: newSubjectRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newSubjectRef.key };
  } catch (error) {
    console.error('Error creating word meaning subject:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWordMeaningSubject = async (subjectId) => {
  try {
    const subjectRef = ref(database, `wordMeaning/subjects/${subjectId}`);
    await remove(subjectRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting word meaning subject:', error);
    return { success: false, error: error.message };
  }
};

export const getWordMeaningChapters = async (subjectId) => {
  try {
    const chaptersRef = ref(database, `wordMeaning/chapters/${subjectId}`);
    const snapshot = await get(chaptersRef);
    if (snapshot.exists()) {
      const chapters = [];
      snapshot.forEach((childSnapshot) => {
        chapters.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return chapters.sort((a, b) => (a.serial || 0) - (b.serial || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching word meaning chapters:', error);
    return [];
  }
};

export const createWordMeaningChapter = async (subjectId, chapterData) => {
  try {
    const chaptersRef = ref(database, `wordMeaning/chapters/${subjectId}`);
    const newChapterRef = push(chaptersRef);
    await set(newChapterRef, {
      ...chapterData,
      id: newChapterRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newChapterRef.key };
  } catch (error) {
    console.error('Error creating word meaning chapter:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWordMeaningChapter = async (subjectId, chapterId) => {
  try {
    const chapterRef = ref(database, `wordMeaning/chapters/${subjectId}/${chapterId}`);
    await remove(chapterRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting word meaning chapter:', error);
    return { success: false, error: error.message };
  }
};

export const getWordMeaningPages = async (chapterId) => {
  try {
    const pagesRef = ref(database, `wordMeaning/pages/${chapterId}`);
    const snapshot = await get(pagesRef);
    if (snapshot.exists()) {
      const pages = [];
      snapshot.forEach((childSnapshot) => {
        pages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching word meaning pages:', error);
    return [];
  }
};

export const createWordMeaningPage = async (chapterId, pageData) => {
  try {
    const pagesRef = ref(database, `wordMeaning/pages/${chapterId}`);
    const newPageRef = push(pagesRef);
    await set(newPageRef, {
      ...pageData,
      id: newPageRef.key,
      createdAt: Date.now()
    });
    return { success: true, id: newPageRef.key };
  } catch (error) {
    console.error('Error creating word meaning page:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWordMeaningPage = async (chapterId, pageId) => {
  try {
    const pageRef = ref(database, `wordMeaning/pages/${chapterId}/${pageId}`);
    await remove(pageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting word meaning page:', error);
    return { success: false, error: error.message };
  }
};

export const uploadWordMeaningQuestions = async (pageId, questions) => {
  try {
    const questionsRef = ref(database, `wordMeaning/questions/${pageId}`);
    await remove(questionsRef);
    
    const uploads = questions.map(question => {
      const newQuestionRef = push(questionsRef);
      return set(newQuestionRef, {
        ...question,
        id: newQuestionRef.key,
        createdAt: Date.now()
      });
    });
    
    await Promise.all(uploads);
    
    // Update page question count
    const pagesRef = ref(database, `wordMeaning/pages`);
    const snapshot = await get(pagesRef);
    
    snapshot.forEach((chapterSnapshot) => {
      chapterSnapshot.forEach((pageSnapshot) => {
        if (pageSnapshot.key === pageId) {
          const chapterId = chapterSnapshot.key;
          update(ref(database, `wordMeaning/pages/${chapterId}/${pageId}`), {
            questionCount: questions.length
          });
        }
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error uploading word meaning questions:', error);
    return { success: false, error: error.message };
  }
};

export const getWordMeaningQuestionsByPage = async (pageId) => {
  try {
    const questionsRef = ref(database, `wordMeaning/questions/${pageId}`);
    const snapshot = await get(questionsRef);
    if (snapshot.exists()) {
      const questions = [];
      snapshot.forEach((childSnapshot) => {
        questions.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return questions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching word meaning questions:', error);
    return [];
  }
};

// Helper function to get questions by multiple chapters
export const getQuestionsByChapters = async (chapterIds) => {
  try {
    if (!chapterIds || chapterIds.length === 0) return [];
    
    const allQuestions = [];
    for (const chapterId of chapterIds) {
      const questions = await getQuestionsByChapter(chapterId);
      allQuestions.push(...questions.map(q => ({ ...q, chapterId })));
    }
    return allQuestions;
  } catch (error) {
    console.error('Error fetching questions by chapters:', error);
    return [];
  }
};

// Get word meaning questions by single page
export const getWordMeaningQuestions = async (pageId) => {
  return await getWordMeaningQuestionsByPage(pageId);
};

// Get word meaning questions by multiple pages
export const getWordMeaningQuestionsByPages = async (pageIds) => {
  try {
    if (!pageIds || pageIds.length === 0) return [];
    
    const allQuestions = [];
    for (const pageId of pageIds) {
      const questions = await getWordMeaningQuestionsByPage(pageId);
      allQuestions.push(...questions.map(q => ({ ...q, pageId })));
    }
    return allQuestions;
  } catch (error) {
    console.error('Error fetching word meaning questions by pages:', error);
    return [];
  }
};

// Get all questions (for database manager)
export const getAllQuestions = async () => {
  try {
    const questionsRef = ref(database, 'questions');
    const snapshot = await get(questionsRef);
    if (snapshot.exists()) {
      const allQuestions = [];
      snapshot.forEach((chapterSnapshot) => {
        chapterSnapshot.forEach((questionSnapshot) => {
          allQuestions.push({
            id: questionSnapshot.key,
            chapterId: chapterSnapshot.key,
            ...questionSnapshot.val()
          });
        });
      });
      return allQuestions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching all questions:', error);
    return [];
  }
};

// Update question (for database manager)
export const updateQuestion = async (chapterId, questionId, updates) => {
  try {
    const questionRef = ref(database, `questions/${chapterId}/${questionId}`);
    await update(questionRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating question:', error);
    return { success: false, error: error.message };
  }
};

// Delete question (for database manager)
export const deleteQuestion = async (chapterId, questionId) => {
  try {
    const questionRef = ref(database, `questions/${chapterId}/${questionId}`);
    await remove(questionRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: error.message };
  }
};

// Update single word meaning question
export const updateWordMeaningQuestion = async (pageId, questionId, updates) => {
  try {
    const questionRef = ref(database, `wordMeaning/questions/${pageId}/${questionId}`);
    await update(questionRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating word meaning question:', error);
    return { success: false, error: error.message };
  }
};


// Backup Management Functions
export const getAllBackups = async () => {
  try {
    const backupsRef = ref(database, 'backups');
    const snapshot = await get(backupsRef);
    if (snapshot.exists()) {
      const backups = [];
      snapshot.forEach((childSnapshot) => {
        backups.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return backups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching backups:', error);
    return [];
  }
};

export const deleteBackup = async (backupId) => {
  try {
    const backupRef = ref(database, `backups/${backupId}`);
    await remove(backupRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return { success: false, error: error.message };
  }
};

export const normalDelete = async (itemType, itemId, parentId = null) => {
  try {
    let itemRef;
    if (itemType === 'subject') {
      itemRef = ref(database, `subjects/${itemId}`);
    } else if (itemType === 'chapter') {
      itemRef = ref(database, `chapters/${parentId}/${itemId}`);
    } else if (itemType === 'question') {
      itemRef = ref(database, `questions/${parentId}/${itemId}`);
    }
    await remove(itemRef);
    return { success: true };
  } catch (error) {
    console.error('Error in normal delete:', error);
    return { success: false, error: error.message };
  }
};

export const completeDelete = async (itemType, itemId, parentId = null) => {
  try {
    // Same as normal delete for now (can be extended for permanent deletion)
    return await normalDelete(itemType, itemId, parentId);
  } catch (error) {
    console.error('Error in complete delete:', error);
    return { success: false, error: error.message };
  }
};

export const restoreFromBackup = async (backupId) => {
  try {
    const backupRef = ref(database, `backups/${backupId}`);
    const snapshot = await get(backupRef);
    if (snapshot.exists()) {
      const backupData = snapshot.val();
      // Restore data based on backup structure
      if (backupData.data) {
        await set(ref(database), backupData.data);
      }
      return { success: true };
    }
    return { success: false, error: 'Backup not found' };
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return { success: false, error: error.message };
  }
};

export const importDatabase = async (jsonData) => {
  try {
    // Import database from JSON
    await set(ref(database), jsonData);
    return { success: true };
  } catch (error) {
    console.error('Error importing database:', error);
    return { success: false, error: error.message };
  }
};

export const installDemoData = async () => {
  try {
    // Install demo data (placeholder - implement based on your requirements)
    console.log('Installing demo data...');
    return { success: true, message: 'Demo data installed' };
  } catch (error) {
    console.error('Error installing demo data:', error);
    return { success: false, error: error.message };
  }
};

export const removeMockData = async () => {
  try {
    // Remove mock data (placeholder - implement based on your requirements)
    console.log('Removing mock data...');
    return { success: true, message: 'Mock data removed' };
  } catch (error) {
    console.error('Error removing mock data:', error);
    return { success: false, error: error.message };
  }
};

export const clearAllData = async () => {
  try {
    // Clear all data from database
    await remove(ref(database));
    return { success: true, message: 'All data cleared' };
  } catch (error) {
    console.error('Error clearing all data:', error);
    return { success: false, error: error.message };
  }
};
