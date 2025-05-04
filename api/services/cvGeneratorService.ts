import PDFDocument from "pdfkit";
import { addSectionTitle, checkPageBreakBeforeDraw } from "../utils/pdfUtils.js";
import { formatDateRange } from "../utils/dateUtils.js";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  location: string | null;
  portfolio_link: string | null;
  professional_summary: string | null;
}

interface WorkExperience {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date: string | Date | null;
  end_date: string | Date | null;
  responsibilities: string | null;
}

interface Education {
  id: string;
  user_id: string;
  institution_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
}

interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  category: string | null;
}

interface Project {
  id: string;
  user_id: string;
  project_name: string | null;
  description: string | null;
  technologies: string[] | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
  project_link?: string | null;
}

export interface ProfileData {
  user: UserProfile;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  targetJobTitle?: string;
}

/**
 * Generates a CV PDF document as a Buffer using pdfkit.
 * @param profileData - The user's profile data.
 * @returns A Promise resolving with the PDF Buffer.
 */
export const generateCvPdf = (profileData: ProfileData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50, // Standard margin
      bufferPages: true,
      info: {
        Title: profileData.targetJobTitle
          ? `${profileData.user.full_name} - ${profileData.targetJobTitle}`
          : `${profileData.user.full_name} - CV`,
        Author: profileData.user.full_name || "Skripta User",
        Subject: profileData.targetJobTitle
          ? `CV for ${profileData.targetJobTitle}`
          : "Curriculum Vitae",
        Keywords: `CV, Resume, ${profileData.targetJobTitle || ""}, ${profileData.skills
          .map((s) => s.skill_name)
          .join(", ")}`
      }
    });
    const buffers: Buffer[] = [];

    const FONT_REGULAR = "Helvetica";
    const FONT_BOLD = "Helvetica-Bold";

    // --- Font Sizes ---
    const FONT_SIZE_NAME = 24;
    const FONT_SIZE_SUBTITLE = 13;
    const FONT_SIZE_CONTACT = 10;
    const FONT_SIZE_BODY = 10;
    const FONT_SIZE_ITEM_TITLE = 12;
    const FONT_SIZE_META = 9;

    // --- Revised Spacing Constants ---
    const SPACING_AFTER_TITLE = 0.5; // Matches pdfUtils
    const SPACING_ITEM = 0.8; // Space after a list/paragraph within a section
    const SPACING_SECTION_GAP = 1.5; // Desired total gap between end of one section's content and START of next title
    const SPACING_HEADER = 0.5;

    // Calculate the spacing needed after the last item in a section loop
    // to achieve the desired SPACING_SECTION_GAP before the next title's SPACING_BEFORE_TITLE
    const SPACING_AFTER_LAST_ITEM = SPACING_SECTION_GAP - SPACING_ITEM;

    const SUBHEADING_BREAK_CHECK_HEIGHT = FONT_SIZE_ITEM_TITLE * 1.3 + FONT_SIZE_BODY * 1.3;

    doc.on("data", buffers.push.bind(buffers));
    doc.on("error", reject);
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // --- PDF Content Generation Logic ---

    // --- Header ---
    doc
      .font(FONT_BOLD)
      .fontSize(FONT_SIZE_NAME)
      .fillColor("black")
      .text(profileData.user.full_name || "Name Missing", { align: "center" });
    doc.moveDown(SPACING_HEADER / 2);

    if (profileData.targetJobTitle) {
      doc
        .font(FONT_REGULAR)
        .fontSize(FONT_SIZE_SUBTITLE)
        .fillColor("#333333") // Dark grey
        .text(profileData.targetJobTitle, { align: "center" });
      doc.moveDown(SPACING_HEADER);
    } else {
      doc.moveDown(SPACING_HEADER / 2);
    }

    // --- Contact Info ---
    doc.font(FONT_REGULAR).fontSize(FONT_SIZE_CONTACT).fillColor("black");
    const contactItems: { text: string; link?: string }[] = [];

    if (profileData.user.location) contactItems.push({ text: profileData.user.location.trim() });
    if (profileData.user.email)
      contactItems.push({
        text: profileData.user.email.trim(),
        link: `mailto:${profileData.user.email.trim()}`
      });
    if (profileData.user.phone_number)
      contactItems.push({ text: profileData.user.phone_number.trim() });
    if (profileData.user.portfolio_link) {
      let potentialUrl = profileData.user.portfolio_link.trim();
      const displayLabel = "Portfolio";
      if (!potentialUrl.match(/^https?:\/\//i)) {
        potentialUrl = "https://" + potentialUrl;
      }
      try {
        const validatedUrl = new URL(potentialUrl);
        contactItems.push({ text: displayLabel, link: validatedUrl.href });
      } catch {
        contactItems.push({ text: displayLabel });
      }
    }

    const separator = "  |  ";
    const fullStringForWidthCalc = contactItems.map((item) => item.text).join(separator);

    const contactY = doc.y;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const textHeight = doc.heightOfString(fullStringForWidthCalc, { width: availableWidth });
    const fullWidth = doc.widthOfString(fullStringForWidthCalc);
    const didWrap = textHeight > FONT_SIZE_CONTACT * 1.3;

    if (didWrap || fullWidth > availableWidth) {
      // --- Draw Left-Aligned (Wrapped) ---
      console.warn("Contact info wrapped or too wide for centering, drawing left-aligned.");
      let wrappedY = contactY;
      let currentX = doc.page.margins.left;
      contactItems.forEach((item, index) => {
        const itemText = item.text;
        const separatorText = index < contactItems.length - 1 ? separator : "";
        const lineContent = itemText + separatorText;
        const itemWidth = doc.widthOfString(lineContent);

        if (
          currentX !== doc.page.margins.left &&
          currentX + itemWidth > availableWidth + doc.page.margins.left
        ) {
          doc.text("", doc.page.margins.left, doc.y);
          wrappedY = doc.y;
          currentX = doc.page.margins.left;
        }

        // Draw text (with link option and underline)
        const textOptions: PDFKit.Mixins.TextOptions = { lineBreak: false };
        if (item.link) {
          textOptions.link = item.link;
          textOptions.underline = true; // Underline OK here
        }
        doc
          .fillColor(item.link ? "blue" : "black")
          .text(item.text, currentX, wrappedY, textOptions)
          .fillColor("black"); // Reset color
        currentX += doc.widthOfString(item.text);

        // Draw separator
        if (separatorText) {
          doc.text(separatorText, currentX, wrappedY, { lineBreak: false });
          currentX += doc.widthOfString(separatorText);
        }
      });
      doc.text("", doc.page.margins.left, doc.y); // Force Y update
      doc.y = doc.y;
    } else {
      // --- Draw Centered (Single Line) - No Underline on Text ---
      let currentX = (doc.page.width - fullWidth) / 2;
      contactItems.forEach((item, index) => {
        const textDrawX = currentX;
        const itemY = contactY;

        // Draw text (Blue if link, NO underline option)
        doc
          .fillColor(item.link ? "blue" : "black")
          .text(item.text, textDrawX, itemY, {
            lineBreak: false
          })
          .fillColor("black"); // Reset color

        const textW = doc.widthOfString(item.text);

        // Add link annotation manually
        if (item.link) {
          const linkX = textDrawX;
          const linkY = itemY;
          const linkW = Math.max(textW, 1);
          const linkH = Math.max(FONT_SIZE_CONTACT, 1);
          if (!isNaN(linkX) && !isNaN(linkY) && !isNaN(linkW) && !isNaN(linkH)) {
            try {
              doc.link(linkX, linkY, linkW, linkH, item.link);
            } catch (linkError) {
              console.error(`Error adding contact link annotation for "${item.text}":`, linkError);
            }
          } else {
            console.warn(
              `Skipping contact link annotation for "${item.text}" due to invalid calculation.`
            );
          }
        }

        // Advance currentX
        currentX = textDrawX + textW;
        if (index < contactItems.length - 1) {
          const sepW = doc.widthOfString(separator);
          if (isNaN(sepW)) {
            console.error(`Separator width is NaN after item ${index}.`);
            currentX += 10;
          } else {
            doc.text(separator, currentX, itemY, { lineBreak: false });
            currentX += sepW;
          }
        }
      });
      doc.y = contactY + textHeight; // Move Y below the single line
    }

    // --- Space and Horizontal Line ---
    doc.moveDown(SPACING_HEADER * 1.5);
    doc
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(SPACING_AFTER_TITLE); // Space after the horizontal line

    // Draw an empty string with all default options explicitly set
    // to clear any lingering state from the contact section.
    try {
      doc
        .font(FONT_REGULAR)
        .fontSize(FONT_SIZE_BODY)
        .fillColor("black")
        .text("", doc.page.margins.left, doc.y, {
          lineBreak: true,
          continued: false,
          align: "left",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
      // This empty text call might slightly advance doc.y, which is usually fine here.
      // If not, we can adjust doc.y later if needed.
    } catch (resetError) {
      console.error("Error attempting to reset text state:", resetError);
    }
    // --- End FORCE Reset ---

    // --- Target Job Title / Professional Summary ---
    const summaryTitle = profileData.targetJobTitle || "Professional Summary";
    addSectionTitle(doc, summaryTitle);
    if (profileData.user.professional_summary) {
      doc
        .font(FONT_REGULAR)
        .fontSize(FONT_SIZE_BODY)
        .text(profileData.user.professional_summary, { align: "justify" });
      doc.moveDown(SPACING_ITEM);
    } else {
      doc.moveDown(SPACING_ITEM);
    }
    doc.moveDown(SPACING_AFTER_LAST_ITEM);

    // --- Work Experience ---
    if (profileData.experience && profileData.experience.length > 0) {
      addSectionTitle(doc, "Professional Experience");
      profileData.experience.forEach((exp) => {
        try {
          checkPageBreakBeforeDraw(doc, SUBHEADING_BREAK_CHECK_HEIGHT);
        } catch (error) {
          console.error(
            `[WorkExp ${exp.job_title}] Error calling checkPageBreakBeforeDraw:`,
            error
          );
        }

        const yPosBeforeItem = doc.y;
        const titleText = `${exp.job_title || "Job Title"}`;
        const companyText = `${exp.company_name || "Company Name"}`;
        const dateRange = formatDateRange(exp.start_date, exp.end_date, "Ongoing");
        const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const dateWidth = doc.font(FONT_REGULAR).fontSize(FONT_SIZE_BODY).widthOfString(dateRange);
        const titleCompanyMaxWidth = availableWidth - dateWidth - 10;

        // Draw Date (Right-aligned)
        doc
          .font(FONT_REGULAR)
          .fontSize(FONT_SIZE_BODY)
          .text(dateRange, doc.page.margins.left, yPosBeforeItem, {
            align: "right",
            width: availableWidth
          });

        // Draw Title | Company
        doc
          .font(FONT_BOLD)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(`${titleText}`, doc.page.margins.left, yPosBeforeItem, {
            width: titleCompanyMaxWidth, // Constrain width
            continued: true,
            align: "left"
          })
          .font(FONT_REGULAR)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(` | `, { continued: true, width: titleCompanyMaxWidth, align: "left" })
          .font(FONT_BOLD)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(`${companyText}`, {
            width: titleCompanyMaxWidth - doc.widthOfString(titleText + " | "),
            continued: false,
            align: "left"
          });

        // Render Responsibilities as a list if they exist
        if (exp.responsibilities) {
          doc.moveDown(0.3);
          doc
            .font(FONT_REGULAR)
            .fontSize(FONT_SIZE_BODY)
            .list(
              exp.responsibilities
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
              {
                bulletRadius: 1.5,
                indent: 15,
                textIndent: 10,
                bulletIndent: 0,
                paragraphGap: 2, // Adjust spacing between bullet points if needed
                align: "justify"
              }
            );
        }

        // Space after this entire work experience item
        doc.moveDown(SPACING_ITEM);
      });
      doc.moveDown(SPACING_AFTER_LAST_ITEM);
    }

    // --- Education ---
    if (profileData.education && profileData.education.length > 0) {
      addSectionTitle(doc, "Education");
      profileData.education.forEach((edu) => {
        try {
          checkPageBreakBeforeDraw(doc, SUBHEADING_BREAK_CHECK_HEIGHT);
        } catch (error) {
          console.error(`[Education ${edu.degree}] Error calling checkPageBreakBeforeDraw:`, error);
        }

        const yPosBeforeItem = doc.y;

        const degreeField = [edu.degree, edu.field_of_study].filter(Boolean).join(" in ");
        const institutionText = `${edu.institution_name || "Institution Name"}`;
        const dateRange = formatDateRange(edu.start_date, edu.end_date, "Ongoing");

        const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const dateWidth = doc.font(FONT_REGULAR).fontSize(FONT_SIZE_BODY).widthOfString(dateRange);
        const titleInstitutionMaxWidth = availableWidth - dateWidth - 10;

        // Draw Date
        doc
          .font(FONT_REGULAR)
          .fontSize(FONT_SIZE_BODY)
          .text(dateRange, doc.page.margins.left, yPosBeforeItem, {
            align: "right",
            width: availableWidth
          });

        // Draw Degree/Field | Institution
        doc
          .font(FONT_BOLD)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(`${degreeField || "Qualification"}`, doc.page.margins.left, yPosBeforeItem, {
            width: titleInstitutionMaxWidth,
            continued: true
          })
          .font(FONT_REGULAR)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(` | `, { continued: true, width: titleInstitutionMaxWidth })
          .font(FONT_BOLD)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .text(`${institutionText}`, {
            width:
              titleInstitutionMaxWidth -
              doc.widthOfString((degreeField || "Qualification") + " | "),
            continued: false
          });

        // No responsibilities in education, just add item spacing
        doc.moveDown(SPACING_ITEM);
      });
      doc.moveDown(SPACING_AFTER_LAST_ITEM);
    }

    // --- Skills ---
    if (profileData.skills && profileData.skills.length > 0) {
      addSectionTitle(doc, "Skills");
      const skillsByCategory: { [key: string]: string[] } = {};
      profileData.skills.forEach((skill) => {
        const category = skill.category || "Technical Skills";
        if (!skillsByCategory[category]) skillsByCategory[category] = [];
        skillsByCategory[category].push(skill.skill_name);
      });

      Object.entries(skillsByCategory).forEach(([category, skillsList]) => {
        doc
          .font(FONT_BOLD)
          .fontSize(FONT_SIZE_BODY)
          .text(`${category}: `, { continued: true });
        doc
          .font(FONT_REGULAR)
          .fontSize(FONT_SIZE_BODY)
          .text(skillsList.join(", "));
        doc.moveDown(0.3); // Space between categories
      });
      // Space after the whole section
      doc.moveDown(SPACING_SECTION_GAP - 0.3);
    }

    // --- Projects ---
    if (profileData.projects && profileData.projects.length > 0) {
      addSectionTitle(doc, "Projects");
      profileData.projects.forEach((proj) => {
        try {
          checkPageBreakBeforeDraw(doc, SUBHEADING_BREAK_CHECK_HEIGHT);
        } catch (error) {
          console.error(
            `[Project ${proj.project_name}] Error calling checkPageBreakBeforeDraw:`,
            error
          );
        }

        const yPosBeforeName = doc.y;
        const projectName = proj.project_name || "Project Name";
        const isLink = !!proj.project_link; // Check if link exists and is not empty/null

        // Project Name
        doc
          .font(isLink ? FONT_REGULAR : FONT_BOLD)
          .fontSize(FONT_SIZE_ITEM_TITLE)
          .fillColor(isLink ? "blue" : "black")
          .text(projectName, { continued: false });
        doc.fillColor("black"); // Reset color after drawing the name

        if (isLink) {
          // Calculate width/height using the correct font (REGULAR for links)
          const textW = doc
            .font(FONT_REGULAR)
            .fontSize(FONT_SIZE_ITEM_TITLE)
            .widthOfString(projectName);
          const textH = doc
            .font(FONT_REGULAR)
            .fontSize(FONT_SIZE_ITEM_TITLE)
            .heightOfString(projectName, { width: availableWidth });

          const linkX = doc.page.margins.left;
          const linkY = yPosBeforeName;
          const linkW = Math.max(textW, 1);
          const linkH = Math.max(textH, 1);

          if (!isNaN(linkX) && !isNaN(linkY) && !isNaN(linkW) && !isNaN(linkH)) {
            try {
              let urlString = proj.project_link;
              if (!urlString) throw new Error("Project link is unexpectedly undefined/null");
              if (!urlString.match(/^https?:\/\//i)) {
                urlString = "https://" + urlString;
              }
              const validatedUrl = new URL(urlString);
              doc.link(linkX, linkY, linkW, linkH, validatedUrl.href);
            } catch (linkError) {
              console.error(
                `Error adding project link annotation for "${projectName}": Invalid URL "${proj.project_link}"?`,
                linkError
              );
            }
          } else {
            console.warn(
              `Skipping project link annotation for "${projectName}" due to invalid calculation.`
            );
          }
        }

        // Dates
        const dateRange = formatDateRange(proj.start_date, proj.end_date, "Ongoing");
        if (dateRange) {
          doc.font(FONT_REGULAR).fontSize(FONT_SIZE_META).fillColor("#444444").text(dateRange);
          doc.fillColor("black");
          doc.moveDown(0.3);
        }

        // Technologies
        if (proj.technologies && proj.technologies.length > 0) {
          doc
            .font(FONT_BOLD)
            .fontSize(FONT_SIZE_BODY)
            .fillColor("#333333")
            .text("Technologies: ", { continued: true });
          doc
            .font(FONT_REGULAR)
            .fontSize(FONT_SIZE_BODY)
            .fillColor("#333333")
            .text(proj.technologies.join(", "));
          doc.fillColor("black");
          doc.moveDown(0.3);
        }

        // Description
        if (proj.description) {
          doc
            .font(FONT_REGULAR)
            .fontSize(FONT_SIZE_BODY)
            .list(
              proj.description
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
              {
                bulletRadius: 1.5,
                indent: 15,
                textIndent: 10,
                bulletIndent: 0,
                paragraphGap: 2,
                align: "justify"
              }
            );
        }

        doc.moveDown(SPACING_ITEM); // Space after this project item
      });
      doc.moveDown(SPACING_AFTER_LAST_ITEM); // Space after the last project
    }
    // --- End of PDF Content ---

    doc.end();
  });
};
