const dateFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: true,
});
const date = value => value ? `${dateFormat.format(new Date(value))} IST` : "Date unavailable";

export default function RequestReceipt({ record, type }) {
  const transfer = type === "transfer";
  const final = ["approved", "rejected"].includes(record.status);
  const approved = record.status === "approved";
  const title = transfer ? "Transfer" : "Cancellation";
  const reference = (transfer ? "TR-" : "CA-") + record._id.slice(-6).toUpperCase();
  const next = record.reviewedAt ? "An academic administrator will record the final decision."
    : transfer ? "Faculty will check the transcript and recommend which credits can count."
    : "Staff will check the admission and send a recommendation to an administrator.";
  return <section className="panel details-panel request-receipt" aria-label={`${title} receipt`}>
    <div className="receipt-brand"><img src="/mit-adt-logo.png" alt="MIT-ADT University, Pune" /><p>Transfera · Academic services pilot</p></div>
    <div className="section-actions"><h2>{title} {final ? "decision" : "submission receipt"}</h2>
      <button className="secondary-button print-action" onClick={() => window.print()}>{final ? "Print decision" : "Print receipt"}</button></div>
    <p className="receipt-reference">{reference} · {record.student?.name} · {record.student?.studentId}</p>
    <p>{transfer ? record.destinationInstitution : record.institution} · {transfer ? record.currentProgram : record.program}</p>
    <p className="muted">Received {date(record.createdAt)}</p>
    {final ? <>
      <p><strong>{approved ? "Approved" : "Rejected"}</strong> · {transfer
        ? `${record.summary.awardedCredits} credits approved for this transfer.`
        : approved ? "This admission is now cancelled." : "Your admission remains unchanged."}</p>
      <p>{transfer ? record.remarks : record.decisionReason}</p>
      {transfer && !!record.evaluation?.matches?.length && <div className="receipt-courses">
        <h3>Decision by subject</h3>
        <ul>{record.evaluation.matches.map(row => <li key={row.currentCode}>{row.currentCode} · {row.currentName} — {approved && row.decision === "accepted" ? `${row.awardedCredits} credits recognised` : "No credits awarded"}</li>)}</ul>
      </div>}
      {transfer && <p className="muted">Curriculum {record.curriculumVersion}{record.policyVersion && ` · Policy ${record.policyVersion}`}</p>}
      {!transfer && approved && <p>Contact Accounts for fee clearance and quote {reference}.</p>}
      {record.reviewedAt && <p className="muted">Reviewed by {record.reviewedBy?.name || "faculty"} · {date(record.reviewedAt)}</p>}
      <p className="muted">Decided by {record.processedBy?.name || "administrator"} · {date(record.decidedAt)}</p>
    </> : <p><strong>Next step</strong> · {next}</p>}
  </section>;
}
