/**
 * PWA Data Exporter - Frontend Only
 * Generates downloadable JS files with class data for offline use
 * Downloads 6 chunks in parallel for optimal speed
 */

import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';

// Helper: Download file to user's computer
export const downloadFile = (filename, content) => {
  console.log(`📥 Downloading: ${filename}`);
  const blob = new Blob([content], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log(`✅ Downloaded: ${filename}`);
};

// Fetch Quiz Data
export const fetchQuizData = async (classId, progressCallback) => {
  try {
    progressCallback?.(`📚 Fetching ${classId} quiz subjects...`);
    
    // Get all subjects
    const subjectsRef = ref(database, 'subjects');
    const subjectsSnap = await get(subjectsRef);
    
    if (!subjectsSnap.exists()) {
      throw new Error('No subjects found in database');
    }
    
    const allSubjects = [];
    subjectsSnap.forEach(child => {
      allSubjects.push({ id: child.key, ...child.val() });
    });
    
    // Filter by class
    const classSubjects = allSubjects.filter(s => s.class === classId);
    console.log(`📚 Found ${classSubjects.length} subjects for ${classId}`);
    
    progressCallback?.(`📖 Fetching chapters for ${classSubjects.length} subjects...`);
    
    // Get chapters for each subject
    const chaptersData = {};
    for (const subject of classSubjects) {
      const chaptersRef = ref(database, `chapters/${subject.id}`);
      const chaptersSnap = await get(chaptersRef);
      
      if (chaptersSnap.exists()) {
        const chapters = [];
        chaptersSnap.forEach(child => {
          chapters.push({ id: child.key, ...child.val() });
        });
        chaptersData[subject.id] = chapters;
        console.log(`  ├─ ${subject.name}: ${chapters.length} chapters`);
      }
    }
    
    progressCallback?.(`❓ Fetching questions...`);
    
    // Get questions for each chapter
    const questionsData = {};
    let totalQuestions = 0;
    
    for (const subjectId in chaptersData) {
      for (const chapter of chaptersData[subjectId]) {
        const questionsRef = ref(database, `questions/${chapter.id}`);
        const questionsSnap = await get(questionsRef);
        
        if (questionsSnap.exists()) {
          const questions = [];
          questionsSnap.forEach(child => {
            questions.push({ id: child.key, ...child.val() });
          });
          questionsData[chapter.id] = questions;
          totalQuestions += questions.length;
        }
      }
    }
    
    console.log(`❓ Total questions: ${totalQuestions}`);
    
    return {
      subjects: classSubjects,
      chapters: chaptersData,
      questions: questionsData,
      stats: {
        subjectsCount: classSubjects.length,
        chaptersCount: Object.values(chaptersData).flat().length,
        questionsCount: totalQuestions
      }
    };
    
  } catch (error) {
    console.error('❌ Error fetching quiz data:', error);
    throw error;
  }
};

// Fetch Word Meanings Data
export const fetchWordMeaningsData = async (classId, progressCallback) => {
  try {
    progressCallback?.(`📖 Fetching ${classId} word meaning subjects...`);
    
    // Get WM subjects
    const wmSubjectsRef = ref(database, 'wordMeaning/subjects');
    const wmSubjectsSnap = await get(wmSubjectsRef);
    
    if (!wmSubjectsSnap.exists()) {
      console.log('⚠️ No word meanings found');
      return null;
    }
    
    const allWMSubjects = [];
    wmSubjectsSnap.forEach(child => {
      allWMSubjects.push({ id: child.key, ...child.val() });
    });
    
    const classWMSubjects = allWMSubjects.filter(s => s.class === classId);
    console.log(`📖 Found ${classWMSubjects.length} WM subjects for ${classId}`);
    
    progressCallback?.(`📄 Fetching WM chapters and pages...`);
    
    // Get chapters
    const wmChapters = {};
    const wmPages = {};
    const wmQuestions = {};
    
    for (const wmSubject of classWMSubjects) {
      // Chapters
      const chaptersRef = ref(database, `wordMeaning/chapters/${wmSubject.id}`);
      const chaptersSnap = await get(chaptersRef);
      
      if (chaptersSnap.exists()) {
        const chapters = [];
        chaptersSnap.forEach(child => {
          chapters.push({ id: child.key, ...child.val() });
        });
        wmChapters[wmSubject.id] = chapters;
        
        // Pages for each chapter
        for (const chapter of chapters) {
          const pagesRef = ref(database, `wordMeaning/pages/${chapter.id}`);
          const pagesSnap = await get(pagesRef);
          
          if (pagesSnap.exists()) {
            const pages = [];
            pagesSnap.forEach(child => {
              pages.push({ id: child.key, ...child.val() });
            });
            wmPages[chapter.id] = pages;
            
            // Questions for each page
            for (const page of pages) {
              const qRef = ref(database, `wordMeaning/questions/${page.id}`);
              const qSnap = await get(qRef);
              
              if (qSnap.exists()) {
                const questions = [];
                qSnap.forEach(child => {
                  questions.push({ id: child.key, ...child.val() });
                });
                wmQuestions[page.id] = questions;
              }
            }
          }
        }
      }
    }
    
    return {
      subjects: classWMSubjects,
      chapters: wmChapters,
      pages: wmPages,
      questions: wmQuestions
    };
    
  } catch (error) {
    console.error('❌ Error fetching word meanings:', error);
    return null; // Word meanings are optional
  }
};

// Create Subject-wise Chunks
export const createChunks = (quizData, wmData) => {
  const chunks = {};
  
  // Quiz chunks (subject-wise)
  for (const subject of quizData.subjects) {
    const subjectChapters = quizData.chapters[subject.id] || [];
    const subjectQuestions = {};
    
    subjectChapters.forEach(chapter => {
      subjectQuestions[chapter.id] = quizData.questions[chapter.id] || [];
    });
    
    chunks[`quiz_${subject.id}`] = {
      type: 'quiz',
      subject: subject,
      chapters: subjectChapters,
      questions: subjectQuestions
    };
  }
  
  // Word meanings chunks (subject-wise)
  if (wmData) {
    for (const wmSubject of wmData.subjects) {
      chunks[`wm_${wmSubject.id}`] = {
        type: 'wordMeaning',
        subject: wmSubject,
        chapters: wmData.chapters[wmSubject.id] || [],
        pages: wmData.pages,
        questions: wmData.questions
      };
    }
  }
  
  return chunks;
};

// Main Export Function
export const exportClassData = async (classId, progressCallback) => {
  try {
    console.log(`\n[PWA Export] ${'='.repeat(60)}`);
    console.log(`[PWA Export] 🚀 Starting PWA data export for ${classId}`);
    console.log(`[PWA Export] ${'='.repeat(60)}`);
    
    // Fetch all data
    console.log(`[PWA Export] Fetching quiz data for ${classId}...`);
    const quizData = await fetchQuizData(classId, progressCallback);
    console.log(`[PWA Export] ✅ Quiz data fetched:`, quizData.stats);
    
    console.log(`[PWA Export] Fetching word meanings for ${classId}...`);
    const wmData = await fetchWordMeaningsData(classId, progressCallback);
    if (wmData) {
      console.log(`[PWA Export] ✅ Word meanings fetched: ${wmData.subjects.length} subjects`);
    } else {
      console.log(`[PWA Export] ⚠️ No word meanings found for ${classId}`);
    }
    
    progressCallback?.('📦 Creating chunks...');
    const chunks = createChunks(quizData, wmData);
    
    console.log(`[PWA Export] 📦 Created ${Object.keys(chunks).length} chunks:`, Object.keys(chunks));
    
    // Create metadata
    const metadata = {
      version: '1.0.0',
      classId: classId,
      lastSync: new Date().toISOString(),
      stats: {
        ...quizData.stats,
        chunksCount: Object.keys(chunks).length
      },
      chunksList: Object.keys(chunks)
    };
    
    progressCallback?.('💾 Generating files...');
    
    // Generate and download metadata
    const classNum = classId.replace('th', '');
    console.log(`[PWA Export] Generating metadata file for Class ${classId}...`);
    
    const metadataContent = `// QuizMaster PWA Data - Metadata
// Class: ${classId}
// Generated: ${metadata.lastSync}
// Version: ${metadata.version}

window.PWA_METADATA_${classNum} = ${JSON.stringify(metadata, null, 2)};

console.log('[PWA Data] ✅ Loaded metadata for Class ${classId}');
`;
    
    downloadFile(`class${classNum}-metadata.js`, metadataContent);
    console.log(`[PWA Export] ✅ Downloaded metadata file`);
    
    // Generate and download each chunk with delay
    console.log(`[PWA Export] Generating ${Object.keys(chunks).length} chunk files...`);
    let chunkIndex = 1;
    for (const [chunkName, chunkData] of Object.entries(chunks)) {
      console.log(`[PWA Export] Generating chunk ${chunkIndex}/${Object.keys(chunks).length}: ${chunkName}`);
      
      const chunkContent = `// QuizMaster PWA Data - Chunk
// Chunk: ${chunkName}
// Type: ${chunkData.type}
// Generated: ${new Date().toISOString()}

window.PWA_CHUNK_${chunkName.toUpperCase().replace(/-/g, '_')} = ${JSON.stringify(chunkData, null, 2)};

console.log('[PWA Data] ✅ Loaded chunk: ${chunkName}');
`;
      
      downloadFile(`class${classNum}-${chunkName}.js`, chunkContent);
      console.log(`[PWA Export] ✅ Downloaded chunk ${chunkIndex}: ${chunkName}`);
      
      // Small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 300));
      chunkIndex++;
    }
    
    console.log(`\n[PWA Export] ${'='.repeat(60)}`);
    console.log(`[PWA Export] ✅ Export complete! Downloaded ${Object.keys(chunks).length + 1} files`);
    console.log(`[PWA Export] Files: 1 metadata + ${Object.keys(chunks).length} chunks`);
    console.log(`[PWA Export] ${'='.repeat(60)}\n`);
    
    return {
      success: true,
      filesCount: Object.keys(chunks).length + 1,
      metadata
    };
    
  } catch (error) {
    console.error('[PWA Export] ❌ Export failed:', error.message);
    console.error('[PWA Export] Stack:', error.stack);
    throw error;
  }
};
