const legacy = require("./demoPolicy");
const pilot = require("./computingPilot.json").policy;

const forStudent = student => pilot.sourcePrograms.includes(student?.previousProgram) ? pilot : legacy;
const sourcePrograms = [...legacy.programs, ...pilot.sourcePrograms];
module.exports = { forStudent, sourcePrograms, pilot };
