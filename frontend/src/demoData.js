// HIGH QUALITY demo data with special formatting, remarks, TRUE/FALSE, and Word Meaning section
export const generateDemoData = () => {
  const timestamp = Date.now();
  const demoData = {
    subjects: [],
    chapters: {},
    questions: {},
    wordMeaningSubjects: [], // SEPARATE for Word Meaning
    wordMeaningChapters: {},
    wordMeaningPages: {},
    wordMeaningQuestions: {}
  };

  // Class 10th - Regular subjects (NO Word Meaning here)
  const class10Data = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry'],
    'Science': ['Light - Reflection and Refraction', 'Electricity', 'Magnetic Effects'],
    'Social Science': ['Nationalism in India', 'Lifelines of Economy', 'Democratic Politics'],
    'English': ['Letter to God', 'Dust of Snow', 'Fire and Ice (Poem)'],
    'Hindi': ['पद्य खंड', 'गद्य खंड', '']  // Empty chapter for testing
  };

  const class11Data = {
    'Physics': ['Physical World', 'Units and Measurements', 'Motion in Straight Line'],
    'Chemistry': ['Structure of Atom', 'Classification of Elements', ''], // Empty
    'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom'],
    'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions']
  };

  const class12Data = {
    'Physics': ['Electric Charges', 'Electrostatic Potential', 'Current Electricity'],
    'Chemistry': ['Solutions', 'Electrochemistry', 'Chemical Kinetics'],
    'Mathematics': ['Relations', 'Inverse Trigonometric Functions', ''], // Empty
    'Computer Science': ['Python Basics', 'Data Structures', 'OOP Concepts']
  };

  // Word Meaning - SEPARATE structure for Word Meaning section
  const wordMeaningData = {
    '10th': {
      subjects: ['Common English Words', 'Advanced Vocabulary'],
      chapters: {
        'Common English Words': ['Basic Words', 'Daily Usage'],
        'Advanced Vocabulary': ['Academic Terms', 'Professional Words']
      }
    },
    '11th': {
      subjects: ['Scientific Vocabulary', 'Literary Terms'],
      chapters: {
        'Scientific Vocabulary': ['Physics Terms', 'Chemistry Terms'],
        'Literary Terms': ['Poetry Analysis', 'Prose Elements']
      }
    },
    '12th': {
      subjects: ['Professional Vocabulary', 'Technical Terms'],
      chapters: {
        'Professional Vocabulary': ['Business English', 'Formal Communication'],
        'Technical Terms': ['Computer Science', 'Engineering']
      }
    }
  };

  const allClassData = [
    { class: '10th', data: class10Data },
    { class: '11th', data: class11Data },
    { class: '12th', data: class12Data }
  ];

  let subjectIdx = 0;
  
  // Regular subjects
  allClassData.forEach(({ class: className, data: subjects }) => {
    Object.entries(subjects).forEach(([subjectName, chapters]) => {
      const subjectId = `subject_${timestamp}_${subjectIdx}`;
      demoData.subjects.push({
        id: subjectId,
        name: subjectName,
        class: className,
        totalChapters: 0,
        source: 'mock',
        createdAt: timestamp + subjectIdx
      });

      demoData.chapters[subjectId] = [];
      
      chapters.forEach((chapterName, chapterIdx) => {
        if (!chapterName) chapterName = `Empty Chapter ${chapterIdx + 1}`; // Blank chapter
        
        const chapterId = `chapter_${timestamp}_${subjectIdx}_${chapterIdx}`;
        const chapter = {
          id: chapterId,
          name: chapterName,
          serial: chapterIdx + 1,
          timer: 30 + (chapterIdx * 10),
          questionCount: 0,
          subjectId: subjectId,
          source: 'mock',
          createdAt: timestamp + subjectIdx + chapterIdx
        };
        demoData.chapters[subjectId].push(chapter);

        // Generate questions (skip for empty chapters)
        const questions = chapterName.includes('Empty') ? [] : generateQualityQuestions(subjectName, chapterName, className, chapterId, timestamp, subjectIdx, chapterIdx);
        demoData.questions[chapterId] = questions;
        chapter.questionCount = questions.length;
      });

      const subjectIndex = demoData.subjects.findIndex(s => s.id === subjectId);
      demoData.subjects[subjectIndex].totalChapters = demoData.chapters[subjectId].length;
      subjectIdx++;
    });
  });

  // Word Meaning - SEPARATE installation
  let wmSubjectIdx = 0;
  Object.entries(wordMeaningData).forEach(([className, { subjects: wmSubjects, chapters: wmChapters }]) => {
    wmSubjects.forEach((subjectName, sIdx) => {
      const wmSubjectId = `wm_subject_${timestamp}_${wmSubjectIdx}`;
      demoData.wordMeaningSubjects.push({
        id: wmSubjectId,
        name: subjectName,
        class: className,
        totalChapters: 0,
        source: 'mock',
        createdAt: timestamp + wmSubjectIdx
      });

      demoData.wordMeaningChapters[wmSubjectId] = [];
      
      const subjectChapters = wmChapters[subjectName] || [];
      subjectChapters.forEach((chapterName, chIdx) => {
        const wmChapterId = `wm_chapter_${timestamp}_${wmSubjectIdx}_${chIdx}`;
        const wmChapter = {
          id: wmChapterId,
          name: chapterName,
          serial: chIdx + 1,
          totalPages: 0,
          subjectId: wmSubjectId,
          source: 'mock',
          createdAt: timestamp + wmSubjectIdx + chIdx
        };
        demoData.wordMeaningChapters[wmSubjectId].push(wmChapter);

        // Generate pages for this chapter (7-10 pages for better pagination testing)
        demoData.wordMeaningPages[wmChapterId] = [];
        const pageCount = Math.floor(Math.random() * 4) + 7;
        
        for (let pIdx = 0; pIdx < pageCount; pIdx++) {
          const wmPageId = `wm_page_${timestamp}_${wmSubjectIdx}_${chIdx}_${pIdx}`;
          const wmPage = {
            id: wmPageId,
            pageNumber: pIdx + 1,
            questionCount: 0,
            chapterId: wmChapterId,
            source: 'mock',
            createdAt: timestamp + wmSubjectIdx + chIdx + pIdx
          };
          demoData.wordMeaningPages[wmChapterId].push(wmPage);

          // Generate word meaning questions for this page
          const wmQuestions = generateWordMeaningQuestions(subjectName, chapterName, className, wmPageId, timestamp, wmSubjectIdx, chIdx, pIdx);
          demoData.wordMeaningQuestions[wmPageId] = wmQuestions;
          wmPage.questionCount = wmQuestions.length;
        }

        wmChapter.totalPages = demoData.wordMeaningPages[wmChapterId].length;
      });

      const wmSubjectIndex = demoData.wordMeaningSubjects.findIndex(s => s.id === wmSubjectId);
      demoData.wordMeaningSubjects[wmSubjectIndex].totalChapters = demoData.wordMeaningChapters[wmSubjectId].length;
      wmSubjectIdx++;
    });
  });

  return demoData;
};

// Generate high quality questions with TRUE/FALSE, remarks variety, special tags
const generateQualityQuestions = (subject, chapter, className, chapterId, timestamp, subIdx, chapIdx) => {
  const questions = [];
  const questionCount = Math.floor(Math.random() * 5) + 4; // 4-8 quality questions

  const questionTemplates = {
    'Mathematics': [
      {
        question: 'Is sin 90° equal to 1?',
        options: ['True', 'False'],
        answer: 'True',
        remarks: ['Correct! sin 90° = 1', 'Wrong, sin 90° = 1'],
        verified: true
      },
      {
        question: 'What is the value of cos 0°?',
        options: ['0', '1', '-1', '∞'],
        answer: '1',
        remarks: ['cos 0° = 1, not 0', 'Correct! cos 0° = 1', 'cos 0° is positive', 'cos 0° is finite']
      },
      {
        question: 'Fill in the blank: The area of circle is !b',
        options: ['πr²', '2πr', 'πd', 'r²'],
        answer: 'πr²',
        remarks: ['That is circumference', 'Perfect! Area = πr²', 'Diameter formula', 'Missing π'],
        verified: true
      },
      {
        question: 'Which formula is for !u quadratic equations !u?',
        options: ['x = -b ± √(b²-4ac)/2a', 'a² + b² = c²', 'ax + b = 0', '!fix None of these'],
        answer: 'x = -b ± √(b²-4ac)/2a',
        remarks: ['Correct! Quadratic formula', 'Pythagoras theorem', 'Linear equation', 'First option correct']
      }
    ],
    'Science': [
      {
        question: 'Is the speed of light faster than sound?',
        options: ['True', 'False'],
        answer: 'True',
        remarks: ['Correct! Light is much faster', 'Wrong, light is faster']
      },
      {
        question: 'The SI unit of electric current is !b',
        options: ['Ampere', 'Volt', 'Ohm', 'Watt'],
        answer: 'Ampere',
        remarks: ['Correct! Current in Ampere', 'Volt is potential', 'Ohm is resistance', 'Watt is power'],
        verified: true
      },
      {
        question: 'What is the speed of light?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '!fix None'],
        answer: '3 × 10⁸ m/s',
        remarks: ['Perfect!', null, null, null] // Only one remark
      },
      {
        question: 'Process of !u photosynthesis !u occurs in:',
        options: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome'],
        answer: 'Chloroplast'
        // No remarks at all
      }
    ],
    'Physics': [
      {
        question: 'Is Newton\'s first law about inertia?',
        options: ['True', 'False'],
        answer: 'True',
        remarks: ['Correct! First law is law of inertia', 'Wrong, it is about inertia'],
        verified: true
      },
      {
        question: 'What is Newton\'s second law?',
        options: ['F = ma', 'F = mv', 'F = m/a', '!fix None'],
        answer: 'F = ma',
        remarks: ['Correct! Force = mass × acceleration', null, null, null]
      }
    ],
    'Chemistry': [
      {
        question: 'Are protons positively charged?',
        options: ['True', 'False'],
        answer: 'True',
        remarks: ['Correct! Protons are positive', 'Wrong, protons are positive']
      },
      {
        question: 'Atomic number represents !b',
        options: ['Protons', 'Neutrons', 'Electrons', 'Nucleons'],
        answer: 'Protons',
        remarks: ['Correct!', null, null, null],
        verified: true
      }
    ],
    'English': [
      {
        question: 'Is "abundant" synonym of "plentiful"?',
        options: ['True', 'False'],
        answer: 'True',
        remarks: ['Correct! They mean the same', 'Wrong, they are synonyms']
      },
      {
        question: 'Synonym of "!u abundant !u"?',
        options: ['Plentiful', 'Scarce', 'Rare', '!fix None'],
        answer: 'Plentiful'
        // No remarks
      }
    ],
    'Hindi': [
      {
        question: 'क्या !u संज्ञा !u 5 प्रकार की होती है?',
        options: ['सही', 'गलत'],
        answer: 'सही',
        remarks: ['बिल्कुल सही!', 'गलत, 5 प्रकार है']
      },
      {
        question: 'रिक्त स्थान: राम ने रोटी !b',
        options: ['खाई', 'खाया', 'खाए', 'खाओ'],
        answer: 'खाई',
        remarks: ['सही! रोटी स्त्रीलिंग', null, null, null]
      }
    ]
  };

  const templates = questionTemplates[subject] || questionTemplates['Science'];
  
  for (let i = 0; i < questionCount; i++) {
    const template = templates[i % templates.length];
    const questionId = `question_${timestamp}_${subIdx}_${chapIdx}_${i}`;
    
    questions.push({
      id: questionId,
      question: template.question,
      options: template.options,
      answer: template.answer,
      remarks: template.remarks || null,
      verified: template.verified || false,
      chapterId: chapterId,
      source: 'mock',
      createdAt: timestamp + subIdx + chapIdx + i
    });
  }

  return questions;
};

// Generate Word Meaning questions
const generateWordMeaningQuestions = (subject, chapter, className, pageId, timestamp, subIdx, chIdx, pIdx) => {
  const questions = [];
  const questionCount = Math.floor(Math.random() * 6) + 10; // 10-15 words per page

  const wordTemplates = [
    {
      question: 'What is the meaning of "!u Abundant !u"?',
      options: ['Plentiful', 'Scarce', 'Limited', 'Rare'],
      answer: 'Plentiful',
      remarks: ['Correct! Abundant = Plentiful', null, null, null]
    },
    {
      question: 'Is "Elegant" synonym of "Graceful"?',
      options: ['True', 'False'],
      answer: 'True',
      remarks: ['Correct! They are synonyms', 'Wrong, they mean the same']
    },
    {
      question: 'Synonym of "Meticulous":',
      options: ['Careful', 'Careless', 'Quick', '!fix None'],
      answer: 'Careful',
      remarks: ['Perfect! Meticulous = Very careful', null, null, null],
      verified: true
    },
    {
      question: 'Fill: She has a !b vocabulary',
      options: ['vast', 'limited', 'poor', 'weak'],
      answer: 'vast'
      // No remarks
    },
    {
      question: 'Meaning of "!u Resilient !u"?',
      options: ['Strong', 'Weak', 'Fragile', 'Soft'],
      answer: 'Strong',
      remarks: ['Correct! Resilient = Strong and flexible', null, null, null]
    },
    {
      question: 'Is "Precise" opposite of "Vague"?',
      options: ['True', 'False'],
      answer: 'True',
      remarks: ['Correct! They are opposites', 'Wrong, they are opposites']
    },
    {
      question: '"Articulate" means !b',
      options: ['Express clearly', 'Speak softly', 'Stay silent', '!fix None'],
      answer: 'Express clearly',
      remarks: ['Perfect!', null, null, null],
      verified: true
    }
  ];

  for (let i = 0; i < questionCount; i++) {
    const template = wordTemplates[i % wordTemplates.length];
    const questionId = `wm_question_${timestamp}_${subIdx}_${chIdx}_${pIdx}_${i}`;
    
    questions.push({
      id: questionId,
      question: template.question,
      options: template.options,
      answer: template.answer,
      remarks: template.remarks || null,
      verified: template.verified || false,
      pageId: pageId,
      source: 'mock',
      createdAt: timestamp + subIdx + chIdx + pIdx + i
    });
  }

  return questions;
};

export const getDemoDataStats = () => {
  const data = generateDemoData();
  let totalQuestions = 0;
  let totalWMQuestions = 0;
  
  Object.values(data.questions).forEach(questions => {
    totalQuestions += questions.length;
  });
  
  Object.values(data.wordMeaningQuestions).forEach(questions => {
    totalWMQuestions += questions.length;
  });

  return {
    subjects: data.subjects.length,
    chapters: Object.values(data.chapters).flat().length,
    questions: totalQuestions,
    wordMeaningSubjects: data.wordMeaningSubjects.length,
    wordMeaningChapters: Object.values(data.wordMeaningChapters).flat().length,
    wordMeaningPages: Object.values(data.wordMeaningPages).flat().length,
    wordMeaningQuestions: totalWMQuestions
  };
};
