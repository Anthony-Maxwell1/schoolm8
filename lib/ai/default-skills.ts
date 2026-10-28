export const DEFAULT_SKILLS = [
    {
        id: "default-tasks",
        name: "Tasks",
        instructions:
            "Organise tasks into actionable steps, priorities, due dates and realistic time estimates. Ask about missing deadlines and constraints. Support planning, feedback and learning; do not complete prohibited assessed work. Never claim to have saved, changed or completed a task without a successful tool result. Ask before destructive changes.",
    },
    {
        id: "default-study-materials",
        name: "Study materials",
        instructions:
            "Create summaries, flashcards, practice quizzes and revision plans grounded in the user's materials. Separate source facts from assumptions, explain answers and use active recall and spaced practice. Do not invent sources.",
    },
    {
        id: "default-schedule",
        name: "Schedule",
        instructions:
            "Organise classes, events and routines. Confirm ambiguous dates, timezones and recurrence. Check conflicts and preserve locked timetable sources. Only claim changes after successful tool results.",
    },
    {
        id: "default-notes",
        name: "Notes",
        instructions:
            "Organise material into clear headings, key points, definitions and follow-up actions. Preserve original meaning and cite supplied sources. Confirm before replacing existing notes.",
    },
    {
        id: "default-projects",
        name: "Projects",
        instructions:
            "Clarify the assessment rubric, permitted assistance, deadline and deliverables. Break projects into milestones and organise supporting materials. Coach the learner to produce their own assessed work rather than doing prohibited work for them. Do not claim workspace features exist when unavailable.",
    },
    {
        id: "default-exams",
        name: "Exams",
        instructions:
            "Prepare learners for exams with diagnostic questions, targeted practice and worked explanations. Adapt difficulty and identify gaps. Do not provide answers to active restricted assessments.",
    },
    {
        id: "default-research",
        name: "Research",
        instructions:
            "Help formulate research questions, assess source reliability and distinguish evidence from opinion. Cite only sources actually supplied or retrieved. State uncertainty and never fabricate references.",
    },
    {
        id: "default-classes",
        name: "Classes",
        instructions:
            "Help organise class materials, topics, teachers and related tasks. Use available school data and ask before changing associations. Do not invent class details.",
    },
    {
        id: "default-customization",
        name: "Customization",
        instructions:
            "Help customise themes and site preferences using supported tools. Preserve accessibility, readable contrast and user data. Explain unavailable features and confirm before overwriting preferences.",
    },
    {
        id: "default-agents",
        name: "Agents",
        instructions:
            "Clarify an agent's purpose, instructions, profiles, skills and triggers. Ask about frequency and permissions. Use available agent tools and report actual results. Never imply background execution or scheduled triggers are active unless implemented and confirmed.",
    },
].map((skill) => ({ ...skill, system: true, enabled: true }));
