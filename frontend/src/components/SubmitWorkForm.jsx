import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export function SubmitWorkForm({ contract, bountyId, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);

  const isSubmitting = status === "uploading" || status === "confirming";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    if (!file) {
      setErrorMessage("Please choose a file to submit.");
      return;
    }
    if (!contract) {
      setErrorMessage("Wallet not connected.");
      return;
    }

    try {
      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || "Work file upload failed");
      }

      const { cid } = await uploadRes.json();

      setStatus("confirming");
      const tx = await contract.submitWork(bountyId, cid);
      await tx.wait();

      setStatus("idle");
      setFile(null);
      onSubmitted?.();
    } catch (err) {
      console.error("Work submission failed:", err);
      setErrorMessage(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to submit work.",
      );
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
    >
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {status === "uploading" && "Uploading..."}
        {status === "confirming" && "Confirming..."}
        {(status === "idle" || status === "error") && "Submit Work"}
      </button>
      {errorMessage && (
        <span style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</span>
      )}
    </form>
  );
}
