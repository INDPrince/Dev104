// Mock data for quiz app - will be replaced with backend integration

export const mockSubjects = [
  {
    id: 'hindi',
    name: 'Hindi',
    totalChapters: 7,
    chapters: [
      {
        id: 'hindi-ch1',
        name: 'Hindi Chapter 1',
        serial: 1,
        questionCount: 6,
        timer: 30
      },
      {
        id: 'hindi-ch2',
        name: 'Hindi Chapter 2',
        serial: 2,
        questionCount: 8,
        timer: 25
      },
      {
        id: 'hindi-ch3',
        name: 'Hindi Chapter 3',
        serial: 3,
        questionCount: 10,
        timer: 30
      },
      {
        id: 'hindi-ch4',
        name: '4. नाखूनों क्यों बढ़ते हैं',
        serial: 4,
        questionCount: 12,
        timer: 35
      },
      {
        id: 'hindi-ch5',
        name: '5. नागरी लिपि',
        serial: 5,
        questionCount: 15,
        timer: 30
      },
      {
        id: 'hindi-ch6',
        name: '3. अति सुधो सनेह को मारग है। (कविता)',
        serial: 6,
        questionCount: 0,
        timer: 25
      },
      {
        id: 'hindi-ch7',
        name: '4. स्वदेशी (कविता)',
        serial: 7,
        questionCount: 0,
        timer: 30
      }
    ]
  },
  {
    id: 'english',
    name: 'English',
    totalChapters: 5,
    chapters: [
      {
        id: 'eng-ch1',
        name: 'Grammar Basics',
        serial: 1,
        questionCount: 20,
        timer: 30
      },
      {
        id: 'eng-ch2',
        name: 'Comprehension',
        serial: 2,
        questionCount: 15,
        timer: 45
      },
      {
        id: 'eng-ch3',
        name: 'Vocabulary',
        serial: 3,
        questionCount: 25,
        timer: 20
      },
      {
        id: 'eng-ch4',
        name: 'Essay Writing',
        serial: 4,
        questionCount: 10,
        timer: 60
      },
      {
        id: 'eng-ch5',
        name: 'Poetry Analysis',
        serial: 5,
        questionCount: 12,
        timer: 40
      }
    ]
  },
  {
    id: 'math',
    name: 'Mathematics',
    totalChapters: 6,
    chapters: [
      {
        id: 'math-ch1',
        name: 'Algebra',
        serial: 1,
        questionCount: 30,
        timer: 45
      },
      {
        id: 'math-ch2',
        name: 'Geometry',
        serial: 2,
        questionCount: 25,
        timer: 50
      },
      {
        id: 'math-ch3',
        name: 'Trigonometry',
        serial: 3,
        questionCount: 20,
        timer: 40
      },
      {
        id: 'math-ch4',
        name: 'Calculus',
        serial: 4,
        questionCount: 28,
        timer: 55
      },
      {
        id: 'math-ch5',
        name: 'Statistics',
        serial: 5,
        questionCount: 22,
        timer: 35
      },
      {
        id: 'math-ch6',
        name: 'Probability',
        serial: 6,
        questionCount: 18,
        timer: 30
      }
    ]
  }
];

// Questions mapped by chapter
export const questionsByChapter = {
  'hindi-ch1': [
    {
      id: 'h1-q1',
      chapterId: 'hindi-ch1',
      question: "'द अनटचेबल्स' किनकी रचना है?",
      answer: "भीमराव अंबेदकर की",
      options: [
        "महात्मा गाँधी की",
        "भीमराव अंबेदकर की",
        "यतीन्द्र मिश्र की",
        "रामविलास शर्मा की"
      ]
    },
    {
      id: 'h1-q2',
      chapterId: 'hindi-ch1',
      question: "भीमराव अंबेदकर का जन्म कब और कहां हुआ था?",
      answer: "14 अप्रैल 1891 ई० में महू, मध्यप्रदेश",
      options: [
        "14 अप्रैल 1991 ई० में महू, मध्यप्रदेश",
        "14 अप्रैल 1891 ई० में महू, मध्यप्रदेश",
        "14 अप्रैल 1891 ई० में बनारस, उत्तरप्रदेश",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h1-q3',
      chapterId: 'hindi-ch1',
      question: "भीमराव अंबेदकर किसके के प्रोत्साहन पर उच्चतर शिक्षा के लिए न्यूयार्क (अमेरिका) गए थे?",
      answer: "बड़ौदा नरेश",
      options: [
        "अशोक",
        "बड़ौदा नरेश",
        " nv दोनों",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h1-q4',
      chapterId: 'hindi-ch1',
      question: "भीमराव अंबेदकर, चिंतन एवं रचनात्मक कार्यों के लिए किन से प्रेरित थे?",
      answer: "उपरोक्त सभी",
      options: [
        "बुद्ध",
        "कबीर",
        "ज्योतिबा फूले",
        " nv उपरोक्त सभी"
      ]
    },
    {
      id: 'h1-q5',
      chapterId: 'hindi-ch1',
      question: "संविधान का निर्माता किन्हें कहां जाता है?",
      answer: "बाबा साहेब भीमराव अंबेडकर",
      options: [
        "बाबा साहेब भीमराव अंबेडकर",
        "पंडित जवाहरलाल नेहरू",
        "डॉ राजेंद्र प्रसाद",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h1-q6',
      chapterId: 'hindi-ch1',
      question: "भीमराव अंबेदकर का निधन कब और कहां हुआ था?",
      answer: "6 दिसंबर, 1956 ई० को दिल्ली में",
      options: [
        "6 दिसंबर, 1957 ई० को पुणे में",
        "9 दिसंबर, 1958 ई० को दिल्ली में",
        "6 दिसंबर, 1956 ई० को दिल्ली में",
        " nv इनमें से कोई नहीं"
      ]
    }
  ],
  'hindi-ch2': [
    {
      id: 'h2-q1',
      chapterId: 'hindi-ch2',
      question: "हिंदी की पहली कहानी किसे माना जाता है?",
      answer: "उसने कहा था",
      options: [
        "उसने कहा था",
        "कफ़न",
        "पूस की रात",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h2-q2',
      chapterId: 'hindi-ch2',
      question: "प्रेमचंद का वास्तविक नाम क्या था?",
      answer: "धनपत राय",
      options: [
        "रामचंद्र",
        "धनपत राय",
        "मुंशी प्रेमचंद",
        "नवाब राय"
      ]
    },
    {
      id: 'h2-q3',
      chapterId: 'hindi-ch2',
      question: "'गोदान' उपन्यास किसने लिखा?",
      answer: "प्रेमचंद",
      options: [
        "जयशंकर प्रसाद",
        "प्रेमचंद",
        "निराला",
        "महादेवी वर्मा"
      ]
    },
    {
      id: 'h2-q4',
      chapterId: 'hindi-ch2',
      question: "कबीर किस काल के कवि थे?",
      answer: "भक्तिकाल",
      options: [
        "रीतिकाल",
        "भक्तिकाल",
        "आदिकाल",
        "आधुनिक काल"
      ]
    },
    {
      id: 'h2-q5',
      chapterId: 'hindi-ch2',
      question: "'मैथिलीशरण गुप्त' को किस उपाधि से सम्मानित किया गया?",
      answer: "राष्ट्रकवि",
      options: [
        "कविवर",
        "राष्ट्रकवि",
        "महाकवि",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h2-q6',
      chapterId: 'hindi-ch2',
      question: "'रामचरितमानस' के रचयिता कौन हैं?",
      answer: "तुलसीदास",
      options: [
        "कबीर",
        "सूरदास",
        "तुलसीदास",
        "रहीम"
      ]
    },
    {
      id: 'h2-q7',
      chapterId: 'hindi-ch2',
      question: "हिंदी दिवस कब मनाया जाता है?",
      answer: "14 सितंबर",
      options: [
        "14 अप्रैल",
        "26 जनवरी",
        "14 सितंबर",
        "15 अगस्त"
      ]
    },
    {
      id: 'h2-q8',
      chapterId: 'hindi-ch2',
      question: "'कामायनी' महाकाव्य के रचयिता कौन हैं?",
      answer: "जयशंकर प्रसाद",
      options: [
        "सूर्यकांत त्रिपाठी निराला",
        "जयशंकर प्रसाद",
        "महादेवी वर्मा",
        "सुमित्रानंदन पंत"
      ]
    }
  ],
  'hindi-ch3': [
    {
      id: 'h3-q1',
      chapterId: 'hindi-ch3',
      question: "हिंदी की पहली पत्रिका कौन सी थी?",
      answer: "उदंत मार्तण्ड",
      options: [
        "सरस्वती",
        "उदंत मार्तण्ड",
        "हंस",
        "कादंबिनी"
      ]
    },
    {
      id: 'h3-q2',
      chapterId: 'hindi-ch3',
      question: "भारतेंदु हरिश्चंद्र का जन्म कहाँ हुआ था?",
      answer: "वाराणसी",
      options: [
        "इलाहाबाद",
        "वाराणसी",
        "लखनऊ",
        "दिल्ली"
      ]
    },
    {
      id: 'h3-q3',
      chapterId: 'hindi-ch3',
      question: "'मानसरोवर' कहानी संग्रह किसका है?",
      answer: "प्रेमचंद",
      options: [
        "जयशंकर प्रसाद",
        "प्रेमचंद",
        "अज्ञेय",
        "यशपाल"
      ]
    },
    {
      id: 'h3-q4',
      chapterId: 'hindi-ch3',
      question: "'राग-विराग' किसकी रचना है?",
      answer: "धर्मवीर भारती",
      options: [
        "अज्ञेय",
        "धर्मवीर भारती",
        "मोहन राकेश",
        "भीष्म साहनी"
      ]
    },
    {
      id: 'h3-q5',
      chapterId: 'hindi-ch3',
      question: "'निर्मला' उपन्यास के लेखक कौन हैं?",
      answer: "प्रेमचंद",
      options: [
        "जैनेन्द्र कुमार",
        "प्रेमचंद",
        "अज्ञेय",
        "यशपाल"
      ]
    },
    {
      id: 'h3-q6',
      chapterId: 'hindi-ch3',
      question: "छायावाद के प्रमुख कवि कौन नहीं हैं?",
      answer: "भारतेंदु हरिश्चंद्र",
      options: [
        "जयशंकर प्रसाद",
        "सुमित्रानंदन पंत",
        "भारतेंदु हरिश्चंद्र",
        "महादेवी वर्मा"
      ]
    },
    {
      id: 'h3-q7',
      chapterId: 'hindi-ch3',
      question: "'सूर्यकांत त्रिपाठी निराला' की प्रसिद्ध कविता कौन सी है?",
      answer: "राम की शक्ति पूजा",
      options: [
        "कामायनी",
        "राम की शक्ति पूजा",
        "असाध्य वीणा",
        "आँसू"
      ]
    },
    {
      id: 'h3-q8',
      chapterId: 'hindi-ch3',
      question: "'हरिवंश राय बच्चन' की आत्मकथा का नाम क्या है?",
      answer: "क्या भूलूं क्या याद करूं",
      options: [
        "अपनी खबर",
        "क्या भूलूं क्या याद करूं",
        "मेरी जीवन यात्रा",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h3-q9',
      chapterId: 'hindi-ch3',
      question: "'नदी के द्वीप' उपन्यास किसने लिखा?",
      answer: "अज्ञेय",
      options: [
        "यशपाल",
        "अज्ञेय",
        "भगवतीचरण वर्मा",
        "जैनेन्द्र कुमार"
      ]
    },
    {
      id: 'h3-q10',
      chapterId: 'hindi-ch3',
      question: "'आधे अधूरे' नाटक के लेखक कौन हैं?",
      answer: "मोहन राकेश",
      options: [
        "धर्मवीर भारती",
        "मोहन राकेश",
        "भीष्म साहनी",
        "जगदीश चंद्र माथुर"
      ]
    }
  ],
  'hindi-ch4': [
    // Chapter 4 questions
    {
      id: 'h4-q1',
      chapterId: 'hindi-ch4',
      question: "'नाखून क्यों बढ़ते हैं' निबंध के लेखक कौन हैं?",
      answer: "हजारी प्रसाद द्विवेदी",
      options: [
        "रामचंद्र शुक्ल",
        "हजारी प्रसाद द्विवेदी",
        "महावीर प्रसाद द्विवेदी",
        "धर्मवीर भारती"
      ]
    },
    {
      id: 'h4-q2',
      chapterId: 'hindi-ch4',
      question: "नाखूनों का बढ़ना किस बात का प्रतीक है?",
      answer: "मनुष्य की पाशविक प्रवृत्ति",
      options: [
        "मनुष्य की सभ्यता",
        "मनुष्य की पाशविक प्रवृत्ति",
        "मनुष्य की बुद्धि",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h4-q3',
      chapterId: 'hindi-ch4',
      question: "लेखक के अनुसार मनुष्य क्या है?",
      answer: "संस्कारशील प्राणी",
      options: [
        "सामाजिक प्राणी",
        "संस्कारशील प्राणी",
        "बुद्धिमान प्राणी",
        "विचारशील प्राणी"
      ]
    },
    {
      id: 'h4-q4',
      chapterId: 'hindi-ch4',
      question: "मनुष्य नाखूनों को क्यों काटता है?",
      answer: "सभ्यता के लिए",
      options: [
        "सुंदरता के लिए",
        "स्वच्छता के लिए",
        "सभ्यता के लिए",
        " nv उपरोक्त सभी"
      ]
    },
    {
      id: 'h4-q5',
      chapterId: 'hindi-ch4',
      question: "निबंध में किस युग की चर्चा है?",
      answer: "पाषाण युग",
      options: [
        "कांस्य युग",
        "पाषाण युग",
        "लौह युग",
        "स्वर्ण युग"
      ]
    },
    {
      id: 'h4-q6',
      chapterId: 'hindi-ch4',
      question: "हजारी प्रसाद द्विवेदी का जन्म कहाँ हुआ?",
      answer: "उत्तर प्रदेश",
      options: [
        "बिहार",
        "उत्तर प्रदेश",
        "मध्य प्रदेश",
        "राजस्थान"
      ]
    },
    {
      id: 'h4-q7',
      chapterId: 'hindi-ch4',
      question: "'बाणभट्ट की आत्मकथा' के लेखक कौन हैं?",
      answer: "हजारी प्रसाद द्विवेदी",
      options: [
        "जयशंकर प्रसाद",
        "हजारी प्रसाद द्विवेदी",
        "रामचंद्र शुक्ल",
        "वृंदावनलाल वर्मा"
      ]
    },
    {
      id: 'h4-q8',
      chapterId: 'hindi-ch4',
      question: "निबंध में किस प्रकार की शैली का प्रयोग हुआ है?",
      answer: "ललित निबंध",
      options: [
        "विवरणात्मक",
        "ललित निबंध",
        "विचारात्मक",
        "वर्णनात्मक"
      ]
    },
    {
      id: 'h4-q9',
      chapterId: 'hindi-ch4',
      question: "मनुष्य और पशु में मुख्य अंतर क्या है?",
      answer: "संस्कार और सभ्यता",
      options: [
        "बुद्धि",
        "शक्ति",
        "संस्कार और सभ्यता",
        "भाषा"
      ]
    },
    {
      id: 'h4-q10',
      chapterId: 'hindi-ch4',
      question: "लेखक ने नाखूनों को किस रूप में देखा है?",
      answer: "अस्त्र के रूप में",
      options: [
        "सौंदर्य के रूप में",
        "अस्त्र के रूप में",
        "सुरक्षा के रूप में",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h4-q11',
      chapterId: 'hindi-ch4',
      question: "'अशोक के फूल' किसकी रचना है?",
      answer: "हजारी प्रसाद द्विवेदी",
      options: [
        "रामवृक्ष बेनीपुरी",
        "हजारी प्रसाद द्विवेदी",
        "विद्यानिवास मिश्र",
        "कुबेरनाथ राय"
      ]
    },
    {
      id: 'h4-q12',
      chapterId: 'hindi-ch4',
      question: "लेखक के अनुसार सभ्यता का विकास कैसे हुआ?",
      answer: "संघर्ष से",
      options: [
        "शांति से",
        "संघर्ष से",
        "प्रेम से",
        "शिक्षा से"
      ]
    }
  ],
  'hindi-ch5': [
    // Chapter 5 questions - 15 questions
    {
      id: 'h5-q1',
      chapterId: 'hindi-ch5',
      question: "'नागरी लिपि' निबंध के लेखक कौन हैं?",
      answer: "गुणाकर मुले",
      options: [
        "धर्मवीर भारती",
        "गुणाकर मुले",
        "हजारी प्रसाद द्विवेदी",
        "रामचंद्र शुक्ल"
      ]
    },
    {
      id: 'h5-q2',
      chapterId: 'hindi-ch5',
      question: "नागरी लिपि का विकास किस लिपि से हुआ?",
      answer: "ब्राह्मी लिपि",
      options: [
        "खरोष्ठी लिपि",
        "ब्राह्मी लिपि",
        "देवनागरी लिपि",
        "शारदा लिपि"
      ]
    },
    {
      id: 'h5-q3',
      chapterId: 'hindi-ch5',
      question: "ब्राह्मी लिपि किस दिशा में लिखी जाती थी?",
      answer: "बाएं से दाएं",
      options: [
        "दाएं से बाएं",
        "बाएं से दाएं",
        "ऊपर से नीचे",
        "नीचे से ऊपर"
      ]
    },
    {
      id: 'h5-q4',
      chapterId: 'hindi-ch5',
      question: "देवनागरी लिपि में कितने स्वर हैं?",
      answer: "11",
      options: [
        "10",
        "11",
        "12",
        "13"
      ]
    },
    {
      id: 'h5-q5',
      chapterId: 'hindi-ch5',
      question: "देवनागरी लिपि में कितने व्यंजन हैं?",
      answer: "33",
      options: [
        "30",
        "33",
        "35",
        "36"
      ]
    },
    {
      id: 'h5-q6',
      chapterId: 'hindi-ch5',
      question: "नागरी लिपि का प्रयोग सर्वप्रथम कहाँ हुआ?",
      answer: "गुजरात",
      options: [
        "महाराष्ट्र",
        "गुजरात",
        "राजस्थान",
        "मध्य प्रदेश"
      ]
    },
    {
      id: 'h5-q7',
      chapterId: 'hindi-ch5',
      question: "देवनागरी लिपि की विशेषता क्या है?",
      answer: "वैज्ञानिक",
      options: [
        "सरल",
        "कठिन",
        "वैज्ञानिक",
        " nv उपरोक्त सभी"
      ]
    },
    {
      id: 'h5-q8',
      chapterId: 'hindi-ch5',
      question: "नागरी लिपि में शिरोरेखा कहाँ होती है?",
      answer: "ऊपर",
      options: [
        "नीचे",
        "ऊपर",
        "मध्य में",
        "दोनों ओर"
      ]
    },
    {
      id: 'h5-q9',
      chapterId: 'hindi-ch5',
      question: "किस भाषा में देवनागरी लिपि का प्रयोग होता है?",
      answer: "संस्कृत, हिंदी, मराठी",
      options: [
        "केवल हिंदी",
        "केवल संस्कृत",
        "संस्कृत, हिंदी, मराठी",
        "केवल मराठी"
      ]
    },
    {
      id: 'h5-q10',
      chapterId: 'hindi-ch5',
      question: "गुणाकर मुले का जन्म कहाँ हुआ?",
      answer: "महाराष्ट्र",
      options: [
        "गुजरात",
        "महाराष्ट्र",
        "मध्य प्रदेश",
        "राजस्थान"
      ]
    },
    {
      id: 'h5-q11',
      chapterId: 'hindi-ch5',
      question: "नागरी लिपि में मात्राएं कहाँ लगती हैं?",
      answer: "व्यंजन के साथ",
      options: [
        "अलग से",
        "व्यंजन के साथ",
        "शब्द के अंत में",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h5-q12',
      chapterId: 'hindi-ch5',
      question: "देवनागरी लिपि का सबसे बड़ा गुण क्या है?",
      answer: "ध्वनि के अनुसार लिखना",
      options: [
        "सुंदर होना",
        "ध्वनि के अनुसार लिखना",
        "आसान होना",
        "पुरानी होना"
      ]
    },
    {
      id: 'h5-q13',
      chapterId: 'hindi-ch5',
      question: "नागरी लिपि में संयुक्त अक्षर कैसे बनते हैं?",
      answer: "दो या अधिक व्यंजनों के मेल से",
      options: [
        "स्वर और व्यंजन के मेल से",
        "दो या अधिक व्यंजनों के मेल से",
        "केवल व्यंजनों से",
        "केवल स्वरों से"
      ]
    },
    {
      id: 'h5-q14',
      chapterId: 'hindi-ch5',
      question: "लिपि और भाषा में क्या अंतर है?",
      answer: "लिपि लेखन है, भाषा बोली",
      options: [
        "कोई अंतर नहीं",
        "लिपि लेखन है, भाषा बोली",
        "दोनों एक ही हैं",
        " nv इनमें से कोई नहीं"
      ]
    },
    {
      id: 'h5-q15',
      chapterId: 'hindi-ch5',
      question: "देवनागरी लिपि को किसने मान्यता दी?",
      answer: "भारत सरकार",
      options: [
        "ब्रिटिश सरकार",
        "भारत सरकार",
        "संयुक्त राष्ट्र",
        "साहित्यकारों ने"
      ]
    }
  ]
};

// Helper function to get questions by chapter IDs
export const getQuestionsByChapters = (chapterIds) => {
  let allQuestions = [];
  chapterIds.forEach(chapterId => {
    const chapterQuestions = questionsByChapter[chapterId] || [];
    allQuestions = [...allQuestions, ...chapterQuestions];
  });
  return allQuestions;
};
