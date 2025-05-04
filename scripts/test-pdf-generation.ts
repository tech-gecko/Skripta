import fs from "fs";
import path from "path";
import { generateCvPdf, ProfileData } from "../api/services/cvGeneratorService.js";

// --- Define Sample Data Sets ---

// --- 1. Full Data (Portfolio + Mixed Project Links) ---
const sampleProfileData_Full: ProfileData = {
  user: {
    id: "user-full",
    email: "john.full@example.com",
    full_name: "Johnathan 'Johnny' Full",
    phone_number: "+1-555-111-1111",
    location: "New York, USA",
    portfolio_link: "github.com/johnny-full", // Has portfolio link
    professional_summary:
      "Dynamic Full Stack Developer with extensive experience building robust web applications. Skilled in both frontend and backend technologies, delivering high-quality, scalable solutions. Excellent problem-solver and team player."
  },
  experience: [
    {
      id: "exp-f1",
      user_id: "user-full",
      company_name: "Alpha Tech",
      job_title: "Lead Developer",
      start_date: new Date("2020-01-01"),
      end_date: null,
      responsibilities:
        "Lead development team.\nArchitect scalable solutions.\nMentor junior engineers."
    },
    {
      id: "exp-f2",
      user_id: "user-full",
      company_name: "Beta Solutions",
      job_title: "Software Engineer",
      start_date: new Date("2018-06-01"),
      end_date: new Date("2019-12-31"),
      responsibilities: "Developed backend APIs.\nBuilt frontend components."
    }
  ],
  education: [
    {
      id: "edu-f1",
      user_id: "user-full",
      institution_name: "State University",
      degree: "M.Sc.",
      field_of_study: "Software Engineering",
      start_date: new Date("2016-09-01"),
      end_date: new Date("2018-05-30")
    }
  ],
  skills: [
    { id: "skill-f1", user_id: "user-full", skill_name: "Node.js", category: "Backend" },
    { id: "skill-f2", user_id: "user-full", skill_name: "React", category: "Frontend" }
  ],
  projects: [
    {
      id: "proj-f1",
      user_id: "user-full",
      project_name: "Project Phoenix",
      description: "A major web application.",
      technologies: ["React", "Node.js"],
      start_date: new Date("2022-01-01"),
      end_date: null,
      project_link: "https://github.com/johnny-full/phoenix"
    }, // Has link
    {
      id: "proj-f2",
      user_id: "user-full",
      project_name: "Internal Dashboard",
      description: "Admin tool.",
      technologies: ["Vue.js", "Express"],
      start_date: new Date("2021-05-01"),
      end_date: new Date("2021-12-31"),
      project_link: null
    } // No link
  ],
  targetJobTitle: "Lead Full Stack Developer"
};

// --- 2. No Links (No Portfolio, No Project Links/Projects) ---
const sampleProfileData_NoLinks: ProfileData = {
  user: {
    id: "user-nolinks",
    email: "jane.nolinks@example.com",
    full_name: "Jane NoLinks",
    phone_number: "+1-555-222-2222",
    location: "London, UK",
    portfolio_link: null, // No portfolio link
    professional_summary:
      "Experienced professional seeking new opportunities. Detail-oriented and efficient."
  },
  experience: [
    {
      id: "exp-n1",
      user_id: "user-nolinks",
      company_name: "Omega Corp",
      job_title: "Analyst",
      start_date: new Date("2019-01-01"),
      end_date: null,
      responsibilities: "Data analysis.\nReport generation."
    }
  ],
  education: [
    {
      id: "edu-n1",
      user_id: "user-nolinks",
      institution_name: "City College",
      degree: "B.A.",
      field_of_study: "Economics",
      start_date: new Date("2015-09-01"),
      end_date: new Date("2018-06-30")
    }
  ],
  skills: [
    { id: "skill-n1", user_id: "user-nolinks", skill_name: "Excel", category: "Tools" },
    {
      id: "skill-n2",
      user_id: "user-nolinks",
      skill_name: "Communication",
      category: "Soft Skills"
    }
  ],
  projects: [], // No projects
  targetJobTitle: "Data Analyst"
};

// --- 3. Portfolio Only (Portfolio Link, No Project Links/Projects) ---
const sampleProfileData_PortfolioOnly: ProfileData = {
  user: {
    id: "user-portfolio",
    email: "peter.portfolio@example.com",
    full_name: "Peter Portfolio",
    phone_number: "+1-555-333-3333",
    location: "San Francisco, USA",
    portfolio_link: "peters-portfolio.dev", // Has portfolio link
    professional_summary:
      "Creative Frontend Developer focused on user experience and design aesthetics."
  },
  experience: [
    {
      id: "exp-p1",
      user_id: "user-portfolio",
      company_name: "Design Hub",
      job_title: "UI Developer",
      start_date: new Date("2021-03-01"),
      end_date: null,
      responsibilities: "Implement UI designs.\nEnsure cross-browser compatibility."
    }
  ],
  education: [
    {
      id: "edu-p1",
      user_id: "user-portfolio",
      institution_name: "Art Institute",
      degree: "Associate",
      field_of_study: "Web Design",
      start_date: new Date("2019-09-01"),
      end_date: new Date("2021-05-30")
    }
  ],
  skills: [
    { id: "skill-p1", user_id: "user-portfolio", skill_name: "HTML", category: "Frontend" },
    { id: "skill-p2", user_id: "user-portfolio", skill_name: "CSS", category: "Frontend" },
    { id: "skill-p3", user_id: "user-portfolio", skill_name: "JavaScript", category: "Frontend" }
  ],
  projects: [], // No projects
  targetJobTitle: "Frontend Developer"
};

// --- 4. Projects Only (No Portfolio Link, Has Project Links) ---
const sampleProfileData_ProjectsOnly: ProfileData = {
  user: {
    id: "user-projects",
    email: "sara.projects@example.com",
    full_name: "Sara Projects",
    phone_number: "+1-555-444-4444",
    location: "Berlin, Germany",
    portfolio_link: null, // No portfolio link
    professional_summary:
      "Backend specialist with a passion for open-source contributions and building efficient systems."
  },
  experience: [
    {
      id: "exp-pr1",
      user_id: "user-projects",
      company_name: "Gamma Systems",
      job_title: "Backend Engineer",
      start_date: new Date("2017-10-01"),
      end_date: null,
      responsibilities: "Develop microservices.\nManage databases.\nWrite unit tests."
    }
  ],
  education: [
    {
      id: "edu-pr1",
      user_id: "user-projects",
      institution_name: "Technical University",
      degree: "Dipl.-Ing.",
      field_of_study: "Informatics",
      start_date: new Date("2012-10-01"),
      end_date: new Date("2017-09-30")
    }
  ],
  skills: [
    { id: "skill-pr1", user_id: "user-projects", skill_name: "Python", category: "Backend" },
    { id: "skill-pr2", user_id: "user-projects", skill_name: "Django", category: "Backend" },
    { id: "skill-pr3", user_id: "user-projects", skill_name: "PostgreSQL", category: "Databases" }
  ],
  projects: [
    // Has projects with links
    {
      id: "proj-pr1",
      user_id: "user-projects",
      project_name: "Open Source Library X",
      description: "Contributed core features.",
      technologies: ["Python"],
      start_date: new Date("2021-01-01"),
      end_date: null,
      project_link: "https://github.com/sara-projects/lib-x"
    },
    {
      id: "proj-pr2",
      user_id: "user-projects",
      project_name: "Utility Tool Y",
      description: "Command-line utility.",
      technologies: ["Go"],
      start_date: new Date("2020-05-01"),
      end_date: new Date("2020-12-31"),
      project_link: "https://github.com/sara-projects/tool-y"
    }
  ],
  targetJobTitle: "Senior Backend Engineer"
};

// --- 5. Long Data (To test page breaks) ---
const sampleProfileData_Long: ProfileData = {
  user: {
    id: "user-long",
    email: "max.long@example.com",
    full_name: "Maximilian Longfellow",
    phone_number: "+1-555-555-5555",
    location: "Toronto, Canada",
    portfolio_link: "github.com/max-long",
    professional_summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum." // Long summary
  },
  experience: [
    // Many experience items
    {
      id: "exp-l1",
      user_id: "user-long",
      company_name: "MegaCorp",
      job_title: "Architect",
      start_date: new Date("2022-01-01"),
      end_date: null,
      responsibilities:
        "Responsibility 1.\nResponsibility 2.\nResponsibility 3.\nResponsibility 4.\nResponsibility 5.\nResponsibility 6."
    },
    {
      id: "exp-l2",
      user_id: "user-long",
      company_name: "Global Solutions",
      job_title: "Senior Engineer",
      start_date: new Date("2020-01-01"),
      end_date: new Date("2021-12-31"),
      responsibilities:
        "Responsibility A.\nResponsibility B.\nResponsibility C.\nResponsibility D.\nResponsibility E."
    },
    {
      id: "exp-l3",
      user_id: "user-long",
      company_name: "Startup X",
      job_title: "Developer",
      start_date: new Date("2019-01-01"),
      end_date: new Date("2019-12-31"),
      responsibilities: "Task 1.\nTask 2.\nTask 3.\nTask 4."
    },
    {
      id: "exp-l4",
      user_id: "user-long",
      company_name: "Old Company",
      job_title: "Junior Dev",
      start_date: new Date("2018-01-01"),
      end_date: new Date("2018-12-31"),
      responsibilities: "Did stuff.\nLearned things.\nFixed bugs."
    },
    {
      id: "exp-l5",
      user_id: "user-long",
      company_name: "Another Place",
      job_title: "Intern",
      start_date: new Date("2017-06-01"),
      end_date: new Date("2017-08-31"),
      responsibilities: "Made coffee.\nObserved meetings.\nRan errands."
    }
  ],
  education: [
    // Multiple education items
    {
      id: "edu-l1",
      user_id: "user-long",
      institution_name: "Grand University",
      degree: "PhD",
      field_of_study: "Advanced Computing",
      start_date: new Date("2014-09-01"),
      end_date: new Date("2018-05-30")
    },
    {
      id: "edu-l2",
      user_id: "user-long",
      institution_name: "State College",
      degree: "B.Sc.",
      field_of_study: "Computer Science",
      start_date: new Date("2010-09-01"),
      end_date: new Date("2014-06-30")
    }
  ],
  skills: [
    // Many skills
    { id: "skill-l1", user_id: "user-long", skill_name: "Java", category: "Programming Languages" },
    {
      id: "skill-l2",
      user_id: "user-long",
      skill_name: "Python",
      category: "Programming Languages"
    },
    { id: "skill-l3", user_id: "user-long", skill_name: "C++", category: "Programming Languages" },
    {
      id: "skill-l4",
      user_id: "user-long",
      skill_name: "JavaScript",
      category: "Programming Languages"
    },
    { id: "skill-l5", user_id: "user-long", skill_name: "Spring Boot", category: "Backend" },
    { id: "skill-l6", user_id: "user-long", skill_name: "Django", category: "Backend" },
    { id: "skill-l7", user_id: "user-long", skill_name: "Node.js", category: "Backend" },
    { id: "skill-l8", user_id: "user-long", skill_name: "React", category: "Frontend" },
    { id: "skill-l9", user_id: "user-long", skill_name: "Angular", category: "Frontend" },
    { id: "skill-l10", user_id: "user-long", skill_name: "Vue.js", category: "Frontend" },
    { id: "skill-l11", user_id: "user-long", skill_name: "SQL", category: "Databases" },
    { id: "skill-l12", user_id: "user-long", skill_name: "NoSQL", category: "Databases" },
    { id: "skill-l13", user_id: "user-long", skill_name: "AWS", category: "Cloud" },
    { id: "skill-l14", user_id: "user-long", skill_name: "Azure", category: "Cloud" },
    { id: "skill-l15", user_id: "user-long", skill_name: "GCP", category: "Cloud" },
    { id: "skill-l16", user_id: "user-long", skill_name: "Kubernetes", category: "DevOps" },
    { id: "skill-l17", user_id: "user-long", skill_name: "Docker", category: "DevOps" },
    { id: "skill-l18", user_id: "user-long", skill_name: "Terraform", category: "DevOps" }
  ],
  projects: [
    // Many projects
    {
      id: "proj-l1",
      user_id: "user-long",
      project_name: "Project Alpha",
      description: "Description A.",
      technologies: ["Java", "Spring"],
      start_date: new Date("2023-01-01"),
      end_date: null,
      project_link: "https://github.com/max-long/alpha"
    },
    {
      id: "proj-l2",
      user_id: "user-long",
      project_name: "Project Beta",
      description: "Description B.",
      technologies: ["Python", "Django"],
      start_date: new Date("2022-06-01"),
      end_date: new Date("2022-12-31"),
      project_link: null
    },
    {
      id: "proj-l3",
      user_id: "user-long",
      project_name: "Project Gamma",
      description: "Description C.",
      technologies: ["Node.js", "React"],
      start_date: new Date("2022-01-01"),
      end_date: new Date("2022-05-31"),
      project_link: "https://github.com/max-long/gamma"
    },
    {
      id: "proj-l4",
      user_id: "user-long",
      project_name: "Project Delta",
      description: "Description D.",
      technologies: ["C++"],
      start_date: new Date("2021-01-01"),
      end_date: new Date("2021-12-31"),
      project_link: null
    },
    {
      id: "proj-l5",
      user_id: "user-long",
      project_name: "Project Epsilon",
      description: "Description E.",
      technologies: ["Go", "Vue.js"],
      start_date: new Date("2020-01-01"),
      end_date: new Date("2020-12-31"),
      project_link: "https://github.com/max-long/epsilon"
    }
  ],
  targetJobTitle: "Principal Software Architect"
};

// --- 6. Missing Sections (No Education, No Projects) ---
const sampleProfileData_MissingSections: ProfileData = {
  user: {
    id: "user-missing",
    email: "alex.missing@example.com",
    full_name: "Alex Missing",
    phone_number: "+1-555-666-6666",
    location: "Seattle, USA",
    portfolio_link: "github.com/alex-missing",
    professional_summary:
      "Software developer with experience in backend systems and cloud infrastructure."
  },
  experience: [
    // Has experience
    {
      id: "exp-m1",
      user_id: "user-missing",
      company_name: "Cloud Corp",
      job_title: "Cloud Engineer",
      start_date: new Date("2020-07-01"),
      end_date: null,
      responsibilities: "Managed AWS resources.\nAutomated deployments."
    }
  ],
  education: [], // No education
  skills: [
    // Has skills
    { id: "skill-m1", user_id: "user-missing", skill_name: "AWS", category: "Cloud" },
    {
      id: "skill-m2",
      user_id: "user-missing",
      skill_name: "Python",
      category: "Programming Languages"
    },
    { id: "skill-m3", user_id: "user-missing", skill_name: "Terraform", category: "DevOps" }
  ],
  projects: [], // No projects
  targetJobTitle: "Cloud Infrastructure Engineer"
};

// --- Test Cases Array ---
const testCases: { name: string; data: ProfileData }[] = [
  { name: "full", data: sampleProfileData_Full },
  { name: "no_links", data: sampleProfileData_NoLinks },
  { name: "portfolio_only", data: sampleProfileData_PortfolioOnly },
  { name: "projects_only", data: sampleProfileData_ProjectsOnly },
  { name: "long_data", data: sampleProfileData_Long },
  { name: "missing_sections", data: sampleProfileData_MissingSections }
];

// --- Generate and Save PDFs ---
// Use an async IIFE (Immediately Invoked Function Expression) to use await
(async () => {
  console.log(`Starting PDF generation for ${testCases.length} test cases...`);

  for (const testCase of testCases) {
    const outputFileName = `test_cv_${testCase.name}.pdf`;
    const outputPath = path.join(process.cwd(), outputFileName); // Save in the root directory

    try {
      console.log(`\n[${testCase.name}] Generating test CV...`);
      const pdfBuffer = await generateCvPdf(testCase.data);
      console.log(`[${testCase.name}] PDF buffer created (size: ${pdfBuffer.length} bytes.)`);

      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`[${testCase.name}] Test CV saved successfully to: ${outputPath}`);
    } catch (error) {
      console.error(`[${testCase.name}] Error generating or saving test CV:`, error);
    }
  }

  console.log("\nFinished generating all test PDFs.");
})();
