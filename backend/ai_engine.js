const ROLE_BLUEPRINTS = {
  "Software Engineer": {
    type: "IT",
    language: "javascript",
    topics: ["Data Structures", "Algorithms", "System Design", "Problem Solving", "Software Lifecycle"],
    coding_scenarios: [
      "Write a function to reverse a string without using built-in reverse methods.",
      "Implement a function to check if a given string is a palindrome.",
      "Find the largest and smallest numbers in an unsorted array.",
      "Write a function to find the first non-repeating character in a string.",
      "Implement a basic LRU Cache with get and put methods."
    ],
    rubrics: {
      "Basic": ["Language syntax", "Basic logic", "Variable naming"],
      "Intermediate": ["Complexity analysis", "Object-Oriented patterns", "Error handling"],
      "Advanced": ["Scalability", "Concurrency", "Optimization techniques"]
    }
  },
  "Java Developer": {
    type: "IT",
    language: "java",
    topics: ["Java Core", "Spring Boot", "Hibernate", "Microservices", "JVM Internals", "Multithreading"],
    coding_scenarios: [
      "Write a Java program to check if a number is a Palindrome.",
      "Implement a function to find the Nth Fibonacci number using recursion and then optimization.",
      "Write a Java method to remove duplicates from an ArrayList.",
      "Implement a Thread-Safe Singleton using the Initialization-on-demand holder idiom."
    ],
    rubrics: {
      "Basic": ["Inheritance", "Interfaces", "Collections Framework"],
      "Intermediate": ["Stream API", "Dependency Injection", "Annotations"],
      "Advanced": ["Memory Management", "Garbage Collection tuning", "Microservices architecture"]
    }
  },
  "Frontend Developer": {
    type: "IT",
    language: "javascript",
    topics: ["HTML/CSS", "JavaScript", "React/Vue/Angular", "State Management", "Performance", "Web Accessibility"],
    coding_scenarios: [
      "Write a function to flatten a deeply nested array in JavaScript.",
      "Implement a function that reverses each word in a sentence (e.g., 'Hello World' -> 'olleH dlroW').",
      "Write a custom useLocalStorage hook that syncs state with local storage.",
      "Create a higher-order component (HOC) that adds a 'Loading' spinner to any component."
    ],
    rubrics: {
      "Basic": ["DOM manipulation", "CSS Flex/Grid", "ES6+ syntax"],
      "Intermediate": ["Hooks/Components lifecycle", "API integration", "Responsive design"],
      "Advanced": ["Code splitting", "PWA", "Animation performance", "State architecture"]
    }
  },
  "Data Analyst": {
    type: "IT",
    language: "python",
    topics: ["SQL", "Python/R", "Statistics", "Data Visualization", "ETL Processes", "Excel"],
    coding_scenarios: [
      "Write a function to calculate the average of all prime numbers in a list.",
      "Implement a function to find the most frequent element (mode) in an array.",
      "Write a script to filter a list of records based on multiple date ranges.",
      "Implement a basic data filter that removes outliers from an array."
    ],
    rubrics: {
      "Basic": ["Basic JOINS", "Group By", "Descriptive statistics"],
      "Intermediate": ["Window functions", "Regression analysis", "Data cleaning"],
      "Advanced": ["Machine learning basics", "Big data concepts", "Complex modeling"]
    }
  },
  "HR Executive": {
    type: "NON-IT",
    topics: ["Recruitment", "Employee Relations", "Payroll", "Labor Laws", "Talent Acquisition", "Onboarding"],
    rubrics: {
      "Basic": ["Interview scheduling", "Document management", "Basic communication"],
      "Intermediate": ["Conflict resolution", "Performance appraisal", "Sourcing strategies"],
      "Advanced": ["Strategic HR planning", "Culture building", "Policy formulation"]
    }
  },
  "UI/UX Designer": {
    type: "IT",
    language: "javascript",
    topics: ["Design Principles", "User Research", "Wireframing", "Prototyping", "Figma/Adobe XD", "Accessibility"],
    coding_scenarios: [
      "Write a function to convert a hex color code to an RGB object.",
      "Implement a function that calculates the contrast ratio between two colors.",
      "Write a responsive layout function that calculates column widths based on screen size.",
      "Implement a function to toggle between light and dark themes in a web app."
    ],
    rubrics: {
      "Basic": ["Color theory", "Typography", "Basic layout"],
      "Intermediate": ["User flows", "Interactive prototypes", "Design systems"],
      "Advanced": ["Usability testing", "UX strategy", "Information architecture"]
    }
  },
  "DevOps Engineer": {
    type: "IT",
    language: "python",
    topics: ["CI/CD", "Docker/Kubernetes", "AWS/Azure", "Infrastructure as Code", "Monitoring", "Linux"],
    coding_scenarios: [
      "Write a script to find and delete files older than X days in a directory.",
      "Implement a function to parse a status log and return the percentage of successful requests.",
      "Write a utility to generate a basic Dockerfile template based on project type.",
      "Implement a function to check if a specific port is open on a list of remote hosts."
    ],
    rubrics: {
      "Basic": ["Bash scripting", "Git workflows", "Basic networking"],
      "Intermediate": ["Pipeline configuration", "Container orchestration", "Cloud security"],
      "Advanced": ["Site Reliability Engineering", "Cost optimization", "Scalability architecture"]
    }
  }
};

const ROLE_SPECIFIC_HR_QUESTIONS = {
  "Frontend Developer": [
    "Tell me about yourself.", "Why did you choose frontend development?", "Describe a challenging UI problem you solved.",
    "How do you handle tight deadlines in projects?", "Tell me about a time you worked in a team.", "How do you manage conflicting design opinions?",
    "What motivates you as a developer?", "Describe a situation where you learned a new frontend technology quickly.",
    "How do you ensure responsive design quality?", "Tell me about a project you are proud of.",
    "How do you handle feedback from designers or managers?", "Describe a time when your code caused an issue.",
    "How do you prioritize tasks in frontend projects?", "Tell me about a time you improved website performance.",
    "How do you deal with repetitive work?", "Describe your ideal work environment.", "How do you stay updated with frontend trends?",
    "Explain a situation where you solved a bug under pressure.", "What are your strengths as a frontend developer?", "Why should we hire you?"
  ],
  "Backend Developer": [
    "Tell me about yourself.", "Why are you interested in backend development?", "Describe a backend project you worked on.",
    "How do you handle server-side failures?", "Tell me about a difficult bug you fixed.", "How do you manage API security?",
    "Describe a time you optimized backend performance.", "How do you work with frontend developers?",
    "Explain a situation where you handled database issues.", "What motivates you in software development?",
    "How do you handle production pressure?", "Tell me about a time you learned a new backend framework.",
    "How do you ensure code quality?", "Describe your teamwork experience.", "How do you prioritize tasks?",
    "Tell me about a project deadline challenge.", "How do you manage multiple APIs?", "What are your career goals?",
    "What are your biggest strengths?", "Why should we hire you?"
  ],
  "Full Stack Developer": [
    "Tell me about yourself.", "Why did you become a full stack developer?", "Describe a full stack project you built.",
    "How do you balance frontend and backend tasks?", "Tell me about a difficult technical challenge.",
    "How do you manage project deadlines?", "Describe a time you worked in a team.", "How do you learn new technologies quickly?",
    "Explain a situation where you solved a critical issue.", "How do you ensure scalability in applications?",
    "Describe your communication style.", "How do you handle pressure during deployments?", "Tell me about a mistake you learned from.",
    "How do you handle client requirements?", "Describe your leadership experience.", "How do you debug applications effectively?",
    "What motivates you professionally?", "Describe a situation where you handled conflict.", "What are your strengths?", "Why should we hire you?"
  ],
  "Data Analyst": [
    "Tell me about yourself.", "Why are you interested in data analysis?", "Describe a data project you worked on.",
    "How do you handle incomplete data?", "Tell me about a time you found important insights.", "How do you prioritize analytical tasks?",
    "Describe a challenge in data cleaning.", "How do you explain data to non-technical people?", "Tell me about your teamwork experience.",
    "How do you manage deadlines?", "Describe a time you made a mistake in analysis.", "How do you ensure data accuracy?",
    "What motivates you as a data analyst?", "Describe your problem-solving approach.", "How do you stay updated in analytics?",
    "Tell me about a time you handled pressure.", "How do you manage repetitive tasks?", "What are your strengths?",
    "Where do you see yourself in 5 years?", "Why should we hire you?"
  ],
  "Data Scientist": [
    "Tell me about yourself.", "Why did you choose data science?", "Describe a machine learning project you worked on.",
    "How do you handle large datasets?", "Explain a difficult analytical challenge you solved.", "How do you communicate technical insights?",
    "Tell me about teamwork in a project.", "Describe a time you learned a new algorithm quickly.", "How do you manage deadlines?",
    "Tell me about a project failure.", "How do you handle model accuracy issues?", "What motivates you in AI and data science?",
    "Describe a time you improved model performance.", "How do you manage pressure?", "Explain your approach to problem-solving.",
    "Describe your leadership experience.", "How do you handle criticism?", "What are your strengths?", "What are your career goals?", "Why should we hire you?"
  ],
  "Machine Learning Engineer": [
    "Tell me about yourself.", "Why are you interested in machine learning?", "Describe an ML model you developed.",
    "How do you handle low model accuracy?", "Explain a challenge you faced during training.", "How do you optimize ML pipelines?",
    "Describe your teamwork experience.", "How do you stay updated in AI?", "Tell me about a deployment issue you solved.",
    "How do you handle deadlines?", "Describe your debugging approach.", "How do you manage model bias?",
    "Tell me about a project you are proud of.", "How do you communicate technical concepts?", "Describe a mistake you learned from.",
    "What motivates you professionally?", "How do you handle pressure?", "What are your strengths?",
    "Where do you see yourself in 5 years?", "Why should we hire you?"
  ],
  "DevOps Engineer": [
    "Tell me about yourself.", "Why are you interested in DevOps?", "Describe your experience with CI/CD.",
    "How do you handle server downtime?", "Tell me about a deployment challenge.",
    "How do you manage pressure during production issues?", "Describe your teamwork experience.", "How do you ensure system reliability?",
    "Explain a situation where automation helped.", "How do you prioritize tasks?", "Tell me about a mistake you learned from.",
    "How do you stay updated with DevOps tools?", "Describe a time you solved a critical issue quickly.",
    "How do you handle conflicts in teams?", "What motivates you?", "How do you manage multiple environments?",
    "Describe your problem-solving skills.", "What are your strengths?", "What are your career goals?", "Why should we hire you?"
  ],
  "Cybersecurity Analyst": [
    "Tell me about yourself.", "Why are you interested in cybersecurity?", "Describe a security challenge you handled.",
    "How do you respond to security incidents?", "Tell me about a time you identified a vulnerability.",
    "How do you handle pressure during attacks?", "Describe your teamwork experience.", "How do you stay updated in cybersecurity?",
    "Explain a situation where you prevented a risk.", "How do you prioritize threats?", "Tell me about a mistake you learned from.",
    "How do you communicate security concerns?", "Describe your analytical thinking.", "What motivates you professionally?",
    "How do you handle confidential information?", "Describe a time you solved a critical issue.", "What are your strengths?",
    "How do you manage deadlines?", "Where do you see yourself in 5 years?", "Why should we hire you?"
  ],
  "Quality Assurance (QA) Engineer": [
    "Tell me about yourself.", "Why are you interested in QA testing?", "Describe a testing project you worked on.",
    "How do you identify bugs efficiently?", "Tell me about a difficult bug you found.", "How do you manage repetitive testing tasks?",
    "Describe your teamwork experience.", "How do you handle tight deadlines?",
    "Explain a situation where your testing prevented a major issue.", "How do you prioritize bugs?", "Tell me about a mistake you learned from.",
    "How do you ensure software quality?", "Describe your communication style.", "What motivates you professionally?",
    "How do you stay updated in QA tools?", "Describe your problem-solving skills.", "What are your strengths?",
    "How do you handle pressure?", "What are your career goals?", "Why should we hire you?"
  ],
  "UI/UX Designer": [
    "Tell me about yourself.", "Why are you interested in UI/UX design?", "Describe a design project you are proud of.",
    "How do you handle design criticism?", "Tell me about a difficult design challenge.", "How do you prioritize user experience?",
    "Describe your teamwork experience.", "How do you manage deadlines?",
    "Explain a situation where user feedback changed your design.", "How do you stay updated with design trends?",
    "Tell me about a mistake you learned from.", "How do you communicate with developers?", "Describe your creative process.",
    "What motivates you professionally?", "How do you handle pressure?", "Describe your leadership experience.",
    "What are your strengths?", "How do you solve usability issues?", "What are your career goals?", "Why should we hire you?"
  ],
  "Product Manager": [
    "Tell me about yourself.", "Why are you interested in product management?", "Describe a product you managed.",
    "How do you prioritize product features?", "Tell me about a difficult business decision.", "How do you handle conflicts between teams?",
    "Describe your leadership experience.", "How do you communicate product vision?", "Explain a challenge you solved in a project.",
    "How do you manage deadlines?", "Tell me about a failure you learned from.", "How do you gather user feedback?",
    "Describe your problem-solving approach.", "What motivates you professionally?", "How do you handle pressure?",
    "Describe a time you led a team.", "What are your strengths?", "How do you ensure product success?", "What are your career goals?", "Why should we hire you?"
  ],
  "Project Manager": [
    "Tell me about yourself.", "Why are you interested in project management?", "Describe a project you successfully managed.",
    "How do you handle project delays?", "Tell me about a difficult team situation.", "How do you prioritize tasks?",
    "Describe your leadership style.", "How do you manage project risks?", "Explain a challenge you solved.",
    "How do you communicate with stakeholders?", "Tell me about a failure you learned from.", "How do you handle pressure?",
    "Describe your teamwork experience.", "What motivates you professionally?", "How do you manage deadlines?",
    "Describe a conflict you resolved.", "What are your strengths?", "How do you ensure project quality?", "What are your career goals?", "Why should we hire you?"
  ],
  "Business Analyst": [
    "Tell me about yourself.", "Why are you interested in business analysis?", "Describe a business problem you solved.",
    "How do you gather client requirements?", "Tell me about a difficult stakeholder interaction.", "How do you prioritize business needs?",
    "Describe your teamwork experience.", "How do you manage deadlines?", "Explain a challenge you solved in a project.",
    "How do you handle changing requirements?", "Tell me about a mistake you learned from.",
    "How do you communicate with technical teams?", "Describe your analytical thinking.", "What motivates you professionally?",
    "How do you handle pressure?", "Describe your leadership experience.", "What are your strengths?",
    "How do you ensure business value?", "What are your career goals?", "Why should we hire you?"
  ],
  "Digital Marketing Specialist": [
    "Tell me about yourself.", "Why are you interested in digital marketing?", "Describe a successful marketing campaign.",
    "How do you handle campaign failures?", "Tell me about a difficult client situation.", "How do you manage multiple campaigns?",
    "Describe your teamwork experience.", "How do you stay updated with marketing trends?", "Explain a challenge you solved creatively.",
    "How do you analyze campaign performance?", "Tell me about a mistake you learned from.", "How do you handle pressure?",
    "Describe your communication skills.", "What motivates you professionally?", "How do you prioritize tasks?",
    "Describe a situation where you improved engagement.", "What are your strengths?", "How do you handle deadlines?",
    "What are your career goals?", "Why should we hire you?"
  ],
  "Sales Executive": [
    "Tell me about yourself.", "Why are you interested in sales?", "Describe a successful sales experience.",
    "How do you handle rejection?", "Tell me about a difficult customer.", "How do you build customer relationships?",
    "Describe your teamwork experience.", "How do you manage sales targets?", "Explain a challenge you solved.",
    "How do you stay motivated?", "Tell me about a mistake you learned from.", "How do you handle pressure?",
    "Describe your communication style.", "What motivates you professionally?", "How do you prioritize clients?",
    "Describe a time you exceeded expectations.", "What are your strengths?", "How do you manage deadlines?",
    "What are your career goals?", "Why should we hire you?"
  ],
  "Human Resources (HR) Manager": [
    "Tell me about yourself.", "Why are you interested in HR?", "Describe a hiring process you managed.",
    "How do you handle employee conflicts?", "Tell me about a difficult workplace situation.", "How do you manage recruitment deadlines?",
    "Describe your leadership experience.", "How do you improve employee engagement?", "Explain a challenge you solved in HR.",
    "How do you handle confidential information?", "Tell me about a mistake you learned from.", "How do you manage pressure?",
    "Describe your communication skills.", "What motivates you professionally?", "How do you handle policy violations?",
    "Describe a time you resolved conflict.", "What are your strengths?", "How do you ensure workplace culture?",
    "What are your career goals?", "Why should we hire you?"
  ],
  "Customer Support Executive": [
    "Tell me about yourself.", "Why are you interested in customer support?", "Describe a situation where you helped a customer.",
    "How do you handle angry customers?", "Tell me about a difficult support issue.", "How do you manage multiple customer requests?",
    "Describe your teamwork experience.", "How do you maintain professionalism?", "Explain a challenge you solved quickly.",
    "How do you handle pressure?", "Tell me about a mistake you learned from.", "How do you improve customer satisfaction?",
    "Describe your communication style.", "What motivates you professionally?", "How do you prioritize support tickets?",
    "Describe a time you exceeded customer expectations.", "What are your strengths?", "How do you manage deadlines?",
    "What are your career goals?", "Why should we hire you?"
  ],
  "Content Writer": [
    "Tell me about yourself.", "Why are you interested in content writing?", "Describe a writing project you are proud of.",
    "How do you handle writer’s block?", "Tell me about a difficult content deadline.", "How do you research topics effectively?",
    "Describe your teamwork experience.", "How do you manage multiple writing tasks?", "Explain a challenge you solved creatively.",
    "How do you handle feedback from editors?", "Tell me about a mistake you learned from.",
    "How do you stay updated with writing trends?", "Describe your communication skills.", "What motivates you professionally?",
    "How do you handle pressure?", "Describe a time you improved content quality.", "What are your strengths?",
    "How do you ensure originality?", "What are your career goals?", "Why should we hire you?"
  ],
  "Graphic Designer": [
    "Tell me about yourself.", "Why are you interested in graphic design?", "Describe a design project you are proud of.",
    "How do you handle client criticism?", "Tell me about a difficult design challenge.", "How do you manage multiple design tasks?",
    "Describe your teamwork experience.", "How do you stay updated with design trends?", "Explain a challenge you solved creatively.",
    "How do you handle tight deadlines?", "Tell me about a mistake you learned from.", "How do you communicate design ideas?",
    "Describe your creative process.", "What motivates you professionally?", "How do you handle pressure?",
    "Describe a time you improved a design based on feedback.", "What are your strengths?", "How do you ensure design consistency?",
    "What are your career goals?", "Why should we hire you?"
  ],
  "General Resume": [
    "Tell me about yourself.", "What are your strengths?", "What are your weaknesses?", "Why should we hire you?",
    "Describe a challenge you faced.", "How do you handle pressure?", "Tell me about a project you worked on.",
    "How do you work in a team?", "Describe your communication skills.", "How do you manage deadlines?",
    "Tell me about a mistake you learned from.", "What motivates you professionally?", "Describe your leadership experience.",
    "How do you solve problems?", "Describe your ideal work environment.", "How do you handle criticism?",
    "What are your career goals?", "How do you stay updated with new skills?", "What makes you unique?", "Do you have any questions for us?"
  ]
};

const HR_SAMPLE_QUESTIONS = ROLE_SPECIFIC_HR_QUESTIONS["General Resume"];

const HR_BLUEPRINT = {
  type: "NON-IT",
  topics: [
    "Personal Introduction", "Soft Skills", "Career Path", "Behavioral Scenarios",
    "Company Fit", "Leadership & Teamwork", "Goal Alignment"
  ],
  rubrics: {
    "Basic": ["Communication", "Confidence", "Grammar"],
    "Intermediate": ["Authenticity", "STAR Method", "Relevance"],
    "Advanced": ["Maturity", "Leadership Insight", "Strategic Soft Skills"]
  }
};

const getBlueprint = async (role, aiQueue, interviewType = "Technical") => {
  if (interviewType === "HR") {
    return HR_BLUEPRINT;
  }

  const match = Object.keys(ROLE_BLUEPRINTS).find(r => role.toLowerCase().includes(r.toLowerCase()));
  if (match) return ROLE_BLUEPRINTS[match];

  if (aiQueue) {
    try {
      const prompt = `[SYSTEM: ROLE BLUEPRINT GENERATOR]
Task: Generate a technical interview blueprint for a custom role.
Role: ${role}

Output exactly in this JSON format:
{
  "type": "IT" | "NON-IT",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "rubrics": {
    "Basic": ["concept 1", "concept 2"],
    "Intermediate": ["concept 3", "concept 4"],
    "Advanced": ["concept 5", "concept 6"]
  }
}
DO NOT include any other text.`;

      const response = await aiQueue.add(prompt, 300);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    } catch (err) {
      console.error("Dynamic Blueprint Error:", err);
    }
  }

  return ROLE_BLUEPRINTS["Software Engineer"];
};

const generateAdaptivePrompt = (candidateName, role, difficulty, resumeText, chatHistory, blueprint, interviewType = "Technical") => {
  const topics = interviewType === "HR"
    ? "Behavioral, Soft Skills, Career Goals, Cultural Fit"
    : (blueprint?.topics?.join(", ") || "General Technical Skills");

  if (interviewType === "HR") {
    // Determine role-specific HR questions
    const roleMatch = Object.keys(ROLE_SPECIFIC_HR_QUESTIONS).find(r =>
      role.toLowerCase().includes(r.toLowerCase())
    );
    const questionBank = roleMatch ? ROLE_SPECIFIC_HR_QUESTIONS[roleMatch] : HR_SAMPLE_QUESTIONS;

    return `[SYSTEM: HR_DIRECTOR_PERSONA]
Role: ${role}
Candidate: ${candidateName}

IDENTITY: You are a PURE HR Representative. You have NO technical background. You do not understand code, architectures, or technical frameworks.

STRICT RULES:
1. PURE BEHAVIORAL: Even if the candidate mentions "Computer Science", "Programming", or technical tools, YOU MUST IGNORE THEM.
2. DO NOT comment on technical skills. If the candidate mentions them, politely steer back to soft skills or personality.
3. You MUST pick your next question ONLY from this Behavioral Bank:
   ${questionBank.join(" | ")}

4. NO REPETITION: Check the TRANSCRIPT below. If you have already asked a question about "Self Introduction" or "Strengths", pick a DIFFERENT one from the bank (e.g., Teamwork, Conflict, or Goals).
5. Be direct. No conversational filler like "That sounds great" or "I understand". Just ask the question.

TRANSCRIPT:
${chatHistory}

INSTRUCTION: Look at the TRANSCRIPT. What was the last thing asked? Now, pick ONE NEW behavioral question from the bank that has NOT been discussed yet. Wrap it in <Question> tags.

Output EXACTLY in this format:
[DIFFICULTY: 2]
[TOPIC: HR]
[TYPE: BEHAVIORAL]
<Question> Your behavioral question here </Question>

AI:`;
  }

  return `[SYSTEM: TECH_INTERVIEWER]
Role: ${role}
Candidate: ${candidateName}
Difficulty: ${difficulty}/5
Topics: ${topics}

TRANSCRIPT:
${chatHistory}

INSTRUCTION: Ask the next technical question now. Be concise (1-2 sentences). No reasoning or preamble.
Follow this format:
[DIFFICULTY: X]
[TOPIC: Name]
[TYPE: THEORY | CODING]
<Question> Your question here </Question>

AI:`;
};

const generateEvaluationPrompt = (candidateName, role, answeredCount, chatHistory, blueprint, interviewType = "Technical") => {

  if (interviewType === "HR") {
    return `[SYSTEM: HR EXPERT EVALUATOR]
Candidate Name: ${candidateName}
Role: ${role}
Questions Answered: ${answeredCount}

TRANSCRIPT:
${chatHistory}

EVALUATION TASK:
1. Perform a deep analysis of the candidate's communication skills, confidence, clarity, and professionalism.
2. Evaluate if the candidate used the **STAR method** (Situation, Task, Action, Result) for behavioral questions.
3. Identify specific **Strengths** in personality and soft skills.
4. Identify specific **Weaknesses** or areas for improvement in communication.
5. Provide actionable **Improvement Tips** for future interviews.
6. Score each answer: 2 (Excellent), 1 (Good/Partial), 0 (Vague/No Answer).
7. Output exactly in this format:

Performance Report for ${candidateName} (HR Interview):
- **Strengths**: <bullet points>
- **Weaknesses**: <bullet points>
- **Communication Style**: <detailed feedback on fluency, tone, and confidence>
- **How to Improve**: <specific actionable advice for behavioral responses>
- **STAR Method Usage**: <feedback on how well they structured their answers>
- **Verdict**: <Hired/Rejected/Follow-up needed>

[Internal Scoring Only]:
Score: <total_accumulated_score>
Max Possible: ${answeredCount * 2}

AI Response:`;
  }

  return `[SYSTEM: EXPERT EVALUATOR & SKILL GAP ANALYZER]
Candidate Name: ${candidateName}
Role: ${role}
Questions Answered: ${answeredCount}

TRANSCRIPT:
${chatHistory}

EVALUATION TASK:
1. Perform a deep NLP analysis of the candidate's technical accuracy, confidence, and relevance.
2. Carefully analyze any [SUBMITTED CODE] blocks for technical logic, syntax, and algorithmic efficiency. Identify if the candidate correctly implemented the requested solution.
3. Identify specific **Strengths** where the candidate excelled.
4. Identify specific **Weaknesses** or technical gaps.
5. Provide a detailed **Coding Review** if any code was submitted, explaining logic errors or better approaches.
6. Provide actionable **How to Improve** advice for the candidate.
7. Score each answer: 2 (Excellent), 1 (Good/Partial), 0 (Incorrect/No Answer).
8. Output exactly in this format:

Performance Report for ${candidateName}:
- **Strengths**: <bullet points>
- **Weaknesses**: <bullet points>
- **Coding Review**: <detailed feedback on code logic, if applicable>
- **How to Improve**: <specific actionable advice>
- **Communication**: <feedback on clarity and confidence>
- **Verdict**: <Hired/Rejected/Follow-up needed>

[Internal Scoring Only]:
Score: <total_accumulated_score>
Max Possible: ${answeredCount * 2}

AI Response:`;
};

module.exports = {
  ROLE_BLUEPRINTS,
  HR_BLUEPRINT,
  HR_SAMPLE_QUESTIONS,
  getBlueprint,
  generateAdaptivePrompt,
  generateEvaluationPrompt
};
