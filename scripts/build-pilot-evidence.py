"""Regenerate the selectable-text pilot evidence used by the transfer form."""
import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas

root = Path(__file__).resolve().parents[1]
case = json.loads((root / "backend/config/computingPilot.json").read_text())
student = case["students"][0]
out = root / "frontend/public/records/computing-evidence.pdf"
out.parent.mkdir(parents=True, exist_ok=True)
c = Canvas(str(out), pagesize=A4, invariant=True)
c.setTitle("Semester marks and course outcomes | School of Computing pilot")


def label(x, y, text, size=11, bold=False, colour="#24222a"):
    c.setFillColor(colors.HexColor(colour))
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, str(text))


def header(title, page):
    label(46, 783, "SAHYADRI INSTITUTE OF COMPUTING", 13, True, "#483461")
    label(46, 763, "Pune, Maharashtra  /  Fictional sending institution", 10)
    c.setStrokeColor(colors.HexColor("#aa9052"))
    c.line(46, 740, 550, 740)
    label(46, 692, title, 23, True)
    label(46, 661, student["name"] + "   /   " + student["previousStudentId"], 14)
    label(46, 636, student["previousProgram"] + "     |     AY 2025-26")
    label(46, 52, "Fictional academic record - university project", 10, True, "#483461")
    label(518, 52, f"{page} / 2", 10)


header("Statement of marks", 1)
label(46, 577, "Completed semesters 1 and 2", 14, True)
columns = [(46,"Sem."),(91,"Code"),(151,"Course"),(362,"Credits"),(427,"Grade / 10"),(510,"Result")]
for x, title in columns:
    label(x, 540, title, 10, True)
for i, course in enumerate(case["courses"]):
    y = 507 - 44 * i
    for (x, _), value in zip(columns, [course["semester"], course["code"], course["name"], course["credits"], course["gradePoint"], "Pass" if course["gradePoint"] >= case["policy"]["minimumGradePoint"] else "Fail"]):
        label(x, y, value, 10)
    c.line(46, y-13, 550, y-13)
label(46, 296, "Grading scale", 13, True)
label(46, 270, "Grade points are recorded on a ten-point scale. The pilot pass mark is 4/10.")
label(46, 246, "Credits shown are course weights. A failed course earns no transferable credit.")
c.showPage()
header("Course outcomes", 2)
for i, course in enumerate(case["courses"]):
    y = 566 - 106*i
    label(46, y, course["code"] + "   " + course["name"], 14, True, "#483461")
    label(46, y-22, f"Semester {course['semester']}    |    {course['kind']}    |    {course['credits']} credits", 10)
    for j, outcome in enumerate(course["topics"].rstrip(".").split(". ")):
        label(46, y-45-17*j, f"CO{j+1}   {outcome.rstrip('.')}.", 10)
c.showPage()
c.save()
