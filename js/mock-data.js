
const defaultMockData = {
    students: [
        { id: "1", name: "Mohit Garg", studentId: "102024000", email: "mgarg@thapar.edu", skills: ["C++", "Java", "Python", "Machine Learning"], github: "github.com/mohit_garg92" }
    ],
    teams: [
        { id: 1, name: "Smart Campus", description: "Campus solution.", hackathon: "Hack4Good", leaderId: "102024000", capacity: 5, currentMembers: 3, status: "open", skills: ["JavaScript", "SQL"] },
        { id: 2, name: "AI Traffic", description: "Traffic analyzer.", hackathon: "AI Innovation Challenge", leaderId: "999", capacity: 4, currentMembers: 4, status: "closed", skills: ["Python", "ML"] }
    ],
    requests: []
};
if(!localStorage.getItem("ptm_data")) {
    localStorage.setItem("ptm_data", JSON.stringify(defaultMockData));
}
