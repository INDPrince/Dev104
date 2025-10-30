// HIGH QUALITY demo data with special formatting and remarks
export const generateDemoData = () => {
  const timestamp = Date.now();
  const demoData = {
    subjects: [],
    chapters: {},
    questions: {}
  };

  // Class 10th - Quality subjects with real chapter names
  const class10Data = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry'],
    'Science': ['Light - Reflection and Refraction', 'Electricity', 'Magnetic Effects of Electric Current'],
    'Social Science': ['Nationalism in India', 'Lifelines of National Economy', 'Democratic Politics'],
    'English': ['Letter to God', 'Dust of Snow', 'Fire and Ice'],
    'Hindi': ['पद्य खंड', 'गद्य खंड', 'व्याकरण'],
    'Word Meaning': ['Common Words', 'Advanced Vocabulary', 'Idioms & Phrases']
  };

  const class11Data = {
    'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line'],
    'Chemistry': ['Structure of Atom', 'Classification of Elements', 'Chemical Bonding'],
    'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom'],
    'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions'],
    'Word Meaning': ['Academic Words', 'Scientific Terms', 'Literary Vocabulary']
  };

  const class12Data = {
    'Physics': ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity'],
    'Chemistry': ['Solutions', 'Electrochemistry', 'Chemical Kinetics'],
    'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices'],
    'Computer Science': ['Python Basics', 'Data Structures', 'OOP Concepts'],
    'Word Meaning': ['Professional Vocabulary', 'Technical Terms', 'Complex Expressions']
  };

  const allClassData = [
    { class: '10th', data: class10Data },
    { class: '11th', data: class11Data },
    { class: '12th', data: class12Data }
  ];

  let subjectIdx = 0;
  
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

        // Generate HIGH QUALITY questions with special formatting
        const questions = generateQualityQuestions(subjectName, chapterName, className, chapterId, timestamp, subjectIdx, chapterIdx);
        demoData.questions[chapterId] = questions;
        chapter.questionCount = questions.length;
      });

      const subjectIndex = demoData.subjects.findIndex(s => s.id === subjectId);
      demoData.subjects[subjectIndex].totalChapters = demoData.chapters[subjectId].length;
      subjectIdx++;
    });
  });

  return demoData;
};

// Generate high quality questions with special formatting and remarks
const generateQualityQuestions = (subject, chapter, className, chapterId, timestamp, subIdx, chapIdx) => {
  const questions = [];
  const questionCount = Math.floor(Math.random() * 4) + 3; // 3-6 quality questions

  const questionTemplates = {
    'Mathematics': [
      {
        question: 'What is the value of sin 90°?',
        options: ['0', '1', '-1', '∞'],
        answer: '1',
        remarks: ['sin 90° is not 0', 'Correct! sin 90° = 1', 'sin 90° is positive', 'sin 90° is finite']
      },
      {
        question: 'Fill in the blank: The area of a circle is !b',
        options: ['πr²', '2πr', 'πd', 'r²'],
        answer: 'πr²',
        remarks: ['That is circumference formula', 'Perfect! Area = πr²', 'That is diameter based', 'Missing π']
      },
      {
        question: 'Which formula is used for !u quadratic equations !u?',
        options: ['x = -b ± √(b²-4ac)/2a', 'a² + b² = c²', 'ax + b = 0', '!fix None of these'],
        answer: 'x = -b ± √(b²-4ac)/2a',
        remarks: ['Correct! Quadratic formula', 'That is Pythagoras theorem', 'That is linear equation', 'Wrong, first option is correct']
      }
    ],
    'Science': [
      {
        question: 'The SI unit of electric current is !b',
        options: ['Ampere', 'Volt', 'Ohm', 'Watt'],
        answer: 'Ampere',
        remarks: ['Correct! Current is measured in Ampere', 'Volt measures potential difference', 'Ohm measures resistance', 'Watt measures power']
      },
      {
        question: 'What is the speed of light in vacuum?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '!fix None of these'],
        answer: '3 × 10⁸ m/s',
        remarks: ['Perfect! Speed of light = 3 × 10⁸ m/s', 'Too slow', 'Too fast', 'First option is correct']
      },
      {
        question: 'The process of !u photosynthesis !u occurs in which part?',
        options: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome'],
        answer: 'Chloroplast',
        remarks: ['Correct! Photosynthesis in chloroplast', 'Mitochondria is for respiration', 'Nucleus has DNA', 'Ribosome makes proteins']
      }
    ],
    'Physics': [
      {
        question: 'What is Newton\'s second law of motion?',
        options: ['F = ma', 'F = mv', 'F = m/a', '!fix None'],
        answer: 'F = ma',
        remarks: ['Correct! Force = mass × acceleration', 'That is momentum formula', 'Incorrect formula', 'First option is correct']
      },
      {
        question: 'The dimension of !u force !u is:',
        options: ['[MLT⁻²]', '[MLT⁻¹]', '[ML²T⁻²]', '[MT⁻²]'],
        answer: '[MLT⁻²]',
        remarks: ['Perfect! Force dimension is [MLT⁻²]', 'That is momentum dimension', 'That is energy dimension', 'Missing length dimension']
      }
    ],
    'Chemistry': [
      {
        question: 'The atomic number represents number of !b',
        options: ['Protons', 'Neutrons', 'Electrons in outer shell', 'Nucleons'],
        answer: 'Protons',
        remarks: ['Correct! Atomic number = protons', 'Neutrons vary in isotopes', 'That is valence electrons', 'That is mass number']
      },
      {
        question: 'What is the pH of !u neutral solution !u?',
        options: ['7', '0', '14', '!fix None'],
        answer: '7',
        remarks: ['Correct! Neutral pH = 7', 'That is strongly acidic', 'That is strongly basic', 'First option is correct']
      }
    ],
    'English': [
      {
        question: 'What is the synonym of "!u abundant !u"?',
        options: ['Plentiful', 'Scarce', 'Rare', '!fix None'],
        answer: 'Plentiful',
        remarks: ['Correct! Abundant = Plentiful', 'That is opposite', 'That is opposite', 'First option is correct']
      },
      {
        question: 'Fill in: "The book is !b the table"',
        options: ['on', 'in', 'at', 'under'],
        answer: 'on',
        remarks: ['Correct! "on the table"', '"in" is for enclosed spaces', '"at" is for locations', '"under" means below']
      }
    ],
    'Hindi': [
      {
        question: '!u संज्ञा !u कितने प्रकार की होती है?',
        options: ['5', '3', '4', '!fix इनमें से कोई नहीं'],
        answer: '5',
        remarks: ['सही! 5 प्रकार की संज्ञा', 'गलत संख्या', 'गलत संख्या', 'पहला विकल्प सही है']
      },
      {
        question: 'रिक्त स्थान भरें: राम ने रोटी !b',
        options: ['खाई', 'खाया', 'खाए', 'खाओ'],
        answer: 'खाई',
        remarks: ['सही! रोटी स्त्रीलिंग है', 'पुलिंग क्रिया है', 'बहुवचन है', 'आदेश है']
      }
    ],
    'Computer Science': [
      {
        question: 'What is the output of: print(!u 2 ** 3 !u)?',
        options: ['8', '6', '9', '!fix Error'],
        answer: '8',
        remarks: ['Correct! 2³ = 8', null, null, null] // Only correct answer has remark
      },
      {
        question: 'Fill in: A list in Python uses !b brackets',
        options: ['[ ]', '( )', '{ }', '< >'],
        answer: '[ ]',
        remarks: null // No remarks at all
      }
    ],
    'Word Meaning': [
      {
        question: 'What is the meaning of "!u Abundant !u"?',
        options: ['Plentiful', 'Scarce', 'Limited', 'Rare'],
        answer: 'Plentiful',
        remarks: ['Correct! Abundant means plentiful', null, null, null] // Only correct answer
      },
      {
        question: 'Choose the synonym of "Elegant":',
        options: ['Graceful', 'Clumsy', 'Rough', '!fix None'],
        answer: 'Graceful',
        remarks: null // No remarks
      },
      {
        question: 'Fill in: "She has a !b vocabulary"',
        options: ['vast', 'limited', 'poor', 'weak'],
        answer: 'vast',
        remarks: ['Perfect!', null, null, null] // Only correct answer
      },
      {
        question: 'What does "!u Meticulous !u" mean?',
        options: ['Very careful', 'Careless', 'Quick', 'Slow'],
        answer: 'Very careful',
        remarks: ['Excellent! Meticulous means very careful and precise', null, null, null]
      }
    ],
    'Social Science': [
      {
        question: 'Who led the Salt March in 1930?',
        options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Subhas Chandra Bose', '!fix None'],
        answer: 'Mahatma Gandhi',
        remarks: ['Correct! Gandhi led the Dandi March', null, null, null]
      },
      {
        question: 'The !u Parliament !u of India has how many houses?',
        options: ['2', '1', '3', '4'],
        answer: '2',
        remarks: null // No remarks
      }
    ],
    'Biology': [
      {
        question: 'What is the powerhouse of the cell?',
        options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'],
        answer: 'Mitochondria',
        remarks: ['Correct! Mitochondria produces ATP', null, null, null]
      },
      {
        question: 'Fill in: DNA stands for !b',
        options: ['Deoxyribonucleic Acid', 'Ribonucleic Acid', 'Amino Acid', '!fix None'],
        answer: 'Deoxyribonucleic Acid',
        remarks: null
      }
    ]
  };

  // Get templates for this subject or use default
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
      chapterId: chapterId,
      source: 'mock',
      createdAt: timestamp + subIdx + chapIdx + i
    });
  }

  return questions;
};

export const getDemoDataStats = () => {
  const data = generateDemoData();
  let totalQuestions = 0;
  Object.values(data.questions).forEach(questions => {
    totalQuestions += questions.length;
  });

  return {
    subjects: data.subjects.length,
    chapters: Object.values(data.chapters).flat().length,
    questions: totalQuestions
  };
};
