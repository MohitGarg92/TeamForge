// mock-data.js – Default data seeded into localStorage on first visit

const defaultMockData = {
    students: [
        {
            id: "1", name: "Mohit Garg", studentId: "102024000",
            email: "mgarg@thapar.edu",
            skills: ["C++", "Java", "Python", "Machine Learning"],
            github: "github.com/mohit_garg92",
            linkedin: "linkedin.com/in/mohitgarg",
            phone: "9876543210"
        },
        {
            id: "2", name: "Alice Sharma", studentId: "102024001",
            email: "alice.sharma@thapar.edu",
            skills: ["JavaScript", "HTML", "CSS", "React"],
            github: "github.com/alicesharma",
            linkedin: "linkedin.com/in/alicesharma",
            phone: "9876543211"
        },
        {
            id: "3", name: "Bob Kumar", studentId: "102024002",
            email: "bob.kumar@thapar.edu",
            skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
            github: "github.com/bobkumar",
            linkedin: "linkedin.com/in/bobkumar",
            phone: "9876543212"
        }
    ],
    teams: [
        {
            id: 1, name: "Smart Campus", description: "Build a sensor-driven campus management system using IoT and cloud services.",
            hackathon: "Hack4Good", leaderId: "102024001", capacity: 5, currentMembers: 3,
            status: "open", skills: ["JavaScript", "SQL", "React"]
        },
        {
            id: 2, name: "AI Traffic", description: "Use ML to predict traffic congestion and optimize signal timings in real-time.",
            hackathon: "AI Innovation Challenge", leaderId: "102024002", capacity: 4, currentMembers: 4,
            status: "closed", skills: ["Python", "Machine Learning", "TensorFlow"]
        },
        {
            id: 3, name: "EcoTrack", description: "A sustainability tracker that monitors campus energy usage and carbon footprint.",
            hackathon: "Hack4Good", leaderId: "102024000", capacity: 3, currentMembers: 1,
            status: "open", skills: ["Python", "SQL", "Data Visualization"]
        },
        {
            id: 4, name: "StudyBuddy", description: "Peer-to-peer study platform matching students by subject and availability.",
            hackathon: "AI Innovation Challenge", leaderId: "102024000", capacity: 4, currentMembers: 2,
            status: "open", skills: ["JavaScript", "Node.js", "MongoDB"]
        }
    ],
    requests: [
        { teamId: 1, studentId: "102024000", status: "Pending" }
    ],
    nextTeamId: 5
};

if (!localStorage.getItem("ptm_data")) {
    localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
}
