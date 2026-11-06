import { useEffect, useState } from "react";
import { GRADE_SCREEN_HELP } from "./gradeHelp";

const STORAGE_KEY = "signmeup.grade-screen-help.v1";

function isHelpContent(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(GRADE_SCREEN_HELP).every((key) => {
      const saved = value[key];
      return (
        saved &&
        typeof saved.purpose === "string" &&
        Array.isArray(saved.instructions) &&
        saved.instructions.every((instruction) => typeof instruction === "string")
      );
    })
  );
}

export default function GradeHelpPanel({
  screen,
  open,
  canEditHelp,
  onClose,
}) {
  const [savedContent, setSavedContent] = useState(GRADE_SCREEN_HELP);
  const [storageMessage, setStorageMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState("");
  const [instructionsDraft, setInstructionsDraft] = useState("");

  const content = savedContent[screen] ?? GRADE_SCREEN_HELP[screen];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) return;

      const parsed = JSON.parse(stored);
      if (!isHelpContent(parsed)) {
        throw new Error("Saved help content has an invalid format.");
      }
      setSavedContent(parsed);
    } catch (error) {
      console.error("Could not load saved grade help.", error);
      setStorageMessage(
        "Saved help could not be loaded. The built-in help is shown instead.",
      );
    }
  }, []);

  useEffect(() => {
    setEditing(false);
    setPurposeDraft(content.purpose);
    setInstructionsDraft(content.instructions.join("\n"));
  }, [screen, content.purpose, content.instructions]);

  function saveHelp(event) {
    event.preventDefault();
    const instructions = instructionsDraft
      .split("\n")
      .map((instruction) => instruction.trim())
      .filter(Boolean);

    if (!purposeDraft.trim() || instructions.length === 0) {
      setStorageMessage("Enter a purpose and at least one usage instruction.");
      return;
    }

    const updated = {
      ...savedContent,
      [screen]: {
        ...content,
        purpose: purposeDraft.trim(),
        instructions,
      },
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedContent(updated);
      setStorageMessage("Help content saved in this browser.");
      setEditing(false);
    } catch (error) {
      console.error("Could not save grade help.", error);
      setStorageMessage("Help content could not be saved in this browser.");
    }
  }

  return (
    <section
      id="grade-screen-help"
      className="gr-help-panel"
      aria-labelledby="grade-help-title"
      hidden={!open}
    >
      <div className="gr-help-heading">
        <div>
          <h2 id="grade-help-title" className="gr-h2">
            {content.title}
          </h2>
          <p className="gr-help-purpose">{content.purpose}</p>
        </div>
        <div className="gr-help-actions">
          {canEditHelp && !editing && (
            <button
              type="button"
              className="gr-btn gr-btn-outline"
              onClick={() => setEditing(true)}
            >
              Edit help
            </button>
          )}
          <button
            type="button"
            className="gr-btn gr-btn-quiet"
            onClick={onClose}
          >
            Close help
          </button>
        </div>
      </div>

      {editing ? (
        <form className="gr-help-editor" onSubmit={saveHelp}>
          <label htmlFor="grade-help-purpose">Screen purpose</label>
          <textarea
            id="grade-help-purpose"
            className="gr-textarea"
            value={purposeDraft}
            onChange={(event) => setPurposeDraft(event.target.value)}
          />
          <label htmlFor="grade-help-instructions">Usage instructions</label>
          <p className="gr-muted">
            Enter one instruction per line. Changes are saved for this browser.
          </p>
          <textarea
            id="grade-help-instructions"
            className="gr-textarea"
            value={instructionsDraft}
            onChange={(event) => setInstructionsDraft(event.target.value)}
          />
          <div className="gr-help-actions">
            <button type="submit" className="gr-btn gr-btn-primary">
              Save help
            </button>
            <button
              type="button"
              className="gr-btn gr-btn-quiet"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <ol className="gr-help-instructions">
          {content.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>
      )}

      {storageMessage && (
        <p className="gr-help-message" role="status" aria-live="polite">
          {storageMessage}
        </p>
      )}
      {canEditHelp && (
        <p className="gr-help-security-note">
          Help editing is controlled by the parent application’s{" "}
          <code>canEditHelp</code> permission.
        </p>
      )}
    </section>
  );
}
