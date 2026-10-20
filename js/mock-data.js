// mock-data.js – Seed data with 4 TIET team members and distinct working vs available projects

const defaultMockData = {
    students: [
        {
            id: "1",
            name: "Mohit Garg",
            studentId: "1024031006",
            email: "mgarg_be24@thapar.edu",
            skills: ["Full Stack", "React", "Node.js", "C++", "System Design"],
            github: "github.com/mohitgarg92",
            linkedin: "linkedin.com/in/mohitgarg",
            phone: "9876543210"
        },
        {
            id: "2",
            name: "Paras Sharma",
            studentId: "1024030609",
            email: "psharma_be24@thapar.edu",
            skills: ["Backend Development", "Node.js", "Python", "SQL", "APIs"],
            github: "github.com/parassharma",
            linkedin: "linkedin.com/in/parassharma",
            phone: "9876543211"
        },
        {
            id: "3",
            name: "Manan Dhingra",
            studentId: "1024030222",
            email: "mdhingra_be24@thapar.edu",
            skills: ["Database & Design", "UI/UX", "JavaScript", "HTML/CSS", "MongoDB"],
            github: "github.com/manandhingra",
            linkedin: "linkedin.com/in/manandhingra",
            phone: "9876543212"
        },
        {
            id: "4",
            name: "Parv Panwar",
            studentId: "1024030226",
            email: "ppanwar_be24@thapar.edu",
            skills: ["Frontend Development", "Machine Learning", "Python", "TensorFlow"],
            github: "github.com/parvpanwar",
            linkedin: "linkedin.com/in/parvpanwar",
            phone: "9876543213"
        }
    ],
    teams: [
        {
            id: 1,
            name: "Smart Campus",
            description: "Build a sensor-driven campus management system using IoT and cloud services.",
            hackathon: "Hack4Good",
            leaderId: "1024030609", // Paras Sharma is Leader
            capacity: 4,
            currentMembers: 2,
            status: "open",
            skills: ["JavaScript", "SQL", "React", "Node.js"],
            members: ["1024030609", "1024031006"] // Mohit Garg is active working member!
        },
        {
            id: 2,
            name: "AI Traffic",
            description: "Use ML to predict traffic congestion and optimize signal timings in real-time.",
            hackathon: "AI Innovation Challenge",
            leaderId: "1024030226", // Parv Panwar is Leader
            capacity: 4,
            currentMembers: 1,
            status: "open",
            skills: ["Python", "Machine Learning", "TensorFlow"],
            members: ["1024030226"]
        },
        {
            id: 3,
            name: "EcoTrack",
            description: "A sustainability tracker that monitors campus energy usage and carbon footprint.",
            hackathon: "Hack4Good",
            leaderId: "1024031006", // Mohit Garg is Leader!
            capacity: 4,
            currentMembers: 2,
            status: "open",
            skills: ["Full Stack", "SQL", "Python", "React"],
            members: ["1024031006", "1024030222"] // Manan Dhingra is member (Parv Panwar is pending request!)
        },
        {
            id: 4,
            name: "DevSphere",
            description: "Student developer portfolio network with project showcase and peer code reviews.",
            hackathon: "AI Innovation Challenge",
            leaderId: "1024030222", // Manan Dhingra is Leader
            capacity: 3,
            currentMembers: 1,
            status: "open",
            skills: ["UI/UX", "JavaScript", "MongoDB"],
            members: ["1024030222"]
        }
    ],
    requests: [
        // Mohit Garg requested to join AI Traffic
        { teamId: 2, studentId: "1024031006", status: "Pending" },
        // Parv Panwar requested to join EcoTrack (Mohit's team) -> PENDING
        { teamId: 3, studentId: "1024030226", status: "Pending" }
    ],
    nextTeamId: 5
};

// Global helper to reset demo state on demand
window.resetDemoData = function() {
    localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
    localStorage.setItem("ptm_version", "teamforge_v6");
    localStorage.setItem("loggedInUser", "1024031006");
};

// Auto-healing migration to teamforge_v6 so any refresh reverts accepted requests
(function initOrHealStorage() {
    const raw = localStorage.getItem("ptm_data");
    let needsReset = false;

    if (!raw || localStorage.getItem("ptm_version") !== "teamforge_v6") {
        needsReset = true;
    } else {
        try {
            const data = JSON.parse(raw);
            const hasStale = data.students && data.students.some(s => 
                s.name.includes("Alice") || 
                s.name.includes("Demo") || 
                s.name.includes("Bob") || 
                s.studentId === "102024000" ||
                s.studentId === "102024001"
            );
            const hasMohitProper = data.students && data.students.some(s => 
                s.studentId === "1024031006" && s.name === "Mohit Garg"
            );
            if (hasStale || !hasMohitProper) {
                needsReset = true;
            }
        } catch (e) {
            needsReset = true;
        }
    }

    if (needsReset) {
        window.resetDemoData();
    }
})();
