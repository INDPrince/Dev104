/**
 * Smart Data Sync System with Retry Logic and Progress Tracking
 * Syncs Firebase data to IndexedDB for offline access
 */

import { getAllSubjects, getChaptersBySubject, getQuestionsByChapter } from '../firebase/services';
import { saveClassData } from './indexedDB';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Retry wrapper with exponential backoff
 */
const retryWithBackoff = async (fn, retries = RETRY_CONFIG.maxRetries, delay = RETRY_CONFIG.initialDelay) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    console.warn(`⚠️ Retry attempt ${RETRY_CONFIG.maxRetries - retries + 1}/${RETRY_CONFIG.maxRetries}. Waiting ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const nextDelay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
    return retryWithBackoff(fn, retries - 1, nextDelay);
  }
};

/**
 * Fetch data with progress tracking and error handling
 */
export const syncClassData = async (classId, progressCallback) => {
  const startTime = Date.now();
  const errors = [];
  
  try {
    console.log(`🚀 [Smart Sync] Starting sync for ${classId}`);
    console.log(`⏰ [Smart Sync] Started at ${new Date().toLocaleTimeString()}`);
    
    // Step 1: Fetch all subjects for this class
    progressCallback?.({ step: 'subjects', progress: 0, message: 'Fetching subjects...' });
    
    const allSubjects = await retryWithBackoff(async () => {
      const subjects = await getAllSubjects();
      
      // Debug: Log all subjects structure
      console.log(`📋 [Smart Sync] Total subjects from Firebase:`, subjects.length);
      if (subjects.length > 0) {
        console.log(`📋 [Smart Sync] Sample subject structure:`, subjects[0]);
        console.log(`📋 [Smart Sync] All subjects:`, subjects.map(s => ({
          id: s.id,
          name: s.name,
          class: s.class,
          classId: s.classId,
          className: s.className
        })));
      }
      
      // Try multiple filter strategies
      let filtered = subjects.filter(s => s.classId === classId);
      
      // If classId doesn't work, try 'class' field
      if (filtered.length === 0) {
        console.log(`⚠️ [Smart Sync] No subjects with classId="${classId}", trying 'class' field...`);
        filtered = subjects.filter(s => s.class === classId);
      }
      
      // If still nothing, try className
      if (filtered.length === 0) {
        console.log(`⚠️ [Smart Sync] No subjects with class="${classId}", trying 'className' field...`);
        filtered = subjects.filter(s => s.className === classId);
      }
      
      // If still nothing, check if classId is in the name or id
      if (filtered.length === 0) {
        console.log(`⚠️ [Smart Sync] Trying name/id contains "${classId}"...`);
        filtered = subjects.filter(s => 
          (s.name && s.name.toLowerCase().includes(classId.toLowerCase())) ||
          (s.id && s.id.toLowerCase().includes(classId.toLowerCase()))
        );
      }
      
      // Last resort: return all subjects if none found
      if (filtered.length === 0) {
        console.warn(`⚠️ [Smart Sync] No subjects found for ${classId}, using ALL subjects`);
        filtered = subjects;
      }
      
      console.log(`✅ [Smart Sync] Filtered subjects for ${classId}:`, filtered.length);
      
      return filtered;
    });
    
    console.log(`✅ [Smart Sync] Found ${allSubjects.length} subjects for ${classId}`);
    progressCallback?.({ step: 'subjects', progress: 100, message: `Found ${allSubjects.length} subjects` });
    
    // Step 2: Fetch all chapters for each subject (parallel)
    progressCallback?.({ step: 'chapters', progress: 0, message: 'Fetching chapters...' });
    
    const chaptersMap = {};
    let totalChapters = 0;
    
    await Promise.all(
      allSubjects.map(async (subject, idx) => {
        try {
          const chapters = await retryWithBackoff(async () => {
            const chaps = await getChaptersBySubject(subject.id);
            if (!chaps || chaps.length === 0) {
              console.warn(`⚠️ [Smart Sync] No chapters found for subject: ${subject.name}`);
            }
            return chaps || [];
          });
          
          chaptersMap[subject.id] = chapters;
          totalChapters += chapters.length;
          
          const progress = Math.round(((idx + 1) / allSubjects.length) * 100);
          progressCallback?.({ 
            step: 'chapters', 
            progress, 
            message: `Fetched chapters for ${subject.name} (${chapters.length} chapters)`
          });
          
          console.log(`✅ [Smart Sync] Subject "${subject.name}": ${chapters.length} chapters`);
        } catch (error) {
          errors.push({
            type: 'chapter_fetch',
            subject: subject.name,
            error: error.message
          });
          console.error(`❌ [Smart Sync] Failed to fetch chapters for ${subject.name}:`, error);
          chaptersMap[subject.id] = [];
        }
      })
    );
    
    console.log(`✅ [Smart Sync] Total chapters: ${totalChapters}`);
    progressCallback?.({ step: 'chapters', progress: 100, message: `Found ${totalChapters} total chapters` });
    
    // Step 3: Fetch questions for all chapters (parallel with chunking)
    progressCallback?.({ step: 'questions', progress: 0, message: 'Fetching questions...' });
    
    const questionsMap = {};
    let totalQuestions = 0;
    let processedChapters = 0;
    
    // Flatten all chapters
    const allChapters = Object.values(chaptersMap).flat();
    
    if (allChapters.length === 0) {
      throw new Error('No chapters available to fetch questions from');
    }
    
    // Process chapters in batches of 5 to avoid overwhelming Firebase
    const BATCH_SIZE = 5;
    for (let i = 0; i < allChapters.length; i += BATCH_SIZE) {
      const batch = allChapters.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (chapter) => {
          try {
            const questions = await retryWithBackoff(async () => {
              const qs = await getQuestionsByChapter(chapter.id);
              if (!qs || qs.length === 0) {
                console.warn(`⚠️ [Smart Sync] No questions found for chapter: ${chapter.name}`);
              }
              return qs || [];
            });
            
            questionsMap[chapter.id] = questions;
            totalQuestions += questions.length;
            
          } catch (error) {
            errors.push({
              type: 'question_fetch',
              chapter: chapter.name,
              error: error.message
            });
            console.error(`❌ [Smart Sync] Failed to fetch questions for ${chapter.name}:`, error);
            questionsMap[chapter.id] = [];
          }
        })
      );
      
      processedChapters += batch.length;
      const progress = Math.round((processedChapters / allChapters.length) * 100);
      progressCallback?.({ 
        step: 'questions', 
        progress, 
        message: `Fetched questions: ${processedChapters}/${allChapters.length} chapters` 
      });
    }
    
    console.log(`✅ [Smart Sync] Total questions: ${totalQuestions}`);
    progressCallback?.({ step: 'questions', progress: 100, message: `Found ${totalQuestions} total questions` });
    
    // Step 4: Create metadata
    const metadata = {
      version: '2.0.0',
      classId: classId,
      lastSync: new Date().toISOString(),
      stats: {
        subjects: allSubjects.length,
        chapters: totalChapters,
        questions: totalQuestions
      },
      errors: errors.length > 0 ? errors : undefined
    };
    
    // Step 5: Create chunks for efficient storage
    progressCallback?.({ step: 'saving', progress: 0, message: 'Saving to IndexedDB...' });
    
    const chunks = {};
    
    // Create subject-wise chunks
    allSubjects.forEach((subject, idx) => {
      chunks[`subject_${subject.id}`] = {
        type: 'quiz',
        subject: subject,
        chapters: chaptersMap[subject.id] || [],
        questions: {}
      };
      
      // Add questions for each chapter
      (chaptersMap[subject.id] || []).forEach(chapter => {
        chunks[`subject_${subject.id}`].questions[chapter.id] = questionsMap[chapter.id] || [];
      });
      
      const progress = Math.round(((idx + 1) / allSubjects.length) * 100);
      progressCallback?.({ step: 'saving', progress, message: `Packaging data: ${idx + 1}/${allSubjects.length} subjects` });
    });
    
    console.log(`📦 [Smart Sync] Created ${Object.keys(chunks).length} data chunks`);
    
    // Step 6: Save to IndexedDB with retry
    await retryWithBackoff(async () => {
      await saveClassData(classId, metadata, chunks);
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ [Smart Sync] Sync completed successfully in ${duration}s`);
    console.log(`📊 [Smart Sync] Stats:`, metadata.stats);
    
    if (errors.length > 0) {
      console.warn(`⚠️ [Smart Sync] Completed with ${errors.length} errors:`, errors);
    }
    
    progressCallback?.({ 
      step: 'complete', 
      progress: 100, 
      message: `Sync complete! ${totalQuestions} questions saved` 
    });
    
    return {
      success: true,
      metadata,
      duration,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error(`❌ [Smart Sync] Failed after ${duration}s:`, error);
    
    progressCallback?.({ 
      step: 'error', 
      progress: 0, 
      message: `Sync failed: ${error.message}` 
    });
    
    return {
      success: false,
      error: error.message,
      duration,
      errors: [...errors, { type: 'fatal', error: error.message }]
    };
  }
};

/**
 * Validate synced data
 */
export const validateSyncedData = async (classId) => {
  try {
    const { getClassData } = await import('./indexedDB');
    const data = await getClassData(classId);
    
    if (!data) {
      return { valid: false, message: 'No data found' };
    }
    
    const { metadata, chunks } = data;
    
    if (!metadata || !chunks) {
      return { valid: false, message: 'Incomplete data structure' };
    }
    
    const chunkCount = Object.keys(chunks).length;
    
    if (chunkCount === 0) {
      return { valid: false, message: 'No chunks found' };
    }
    
    console.log(`✅ [Validation] ${classId} data is valid:`, {
      subjects: metadata.stats?.subjects,
      chapters: metadata.stats?.chapters,
      questions: metadata.stats?.questions,
      chunks: chunkCount
    });
    
    return { 
      valid: true, 
      metadata,
      chunkCount
    };
    
  } catch (error) {
    console.error('❌ [Validation] Error:', error);
    return { valid: false, message: error.message };
  }
};
